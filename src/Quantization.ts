import { assert } from 'console'

const TGA = require('tga')
const _ = require('lodash')

export interface RGBVals {
    r: number
    g: number
    b: number
}
export type Vector3 = RGBVals

const d = (v: RGBVals, w: RGBVals): number => Math.abs(v.r - w.r) + Math.abs(v.g - w.g) + Math.abs(v.b - w.b)
const eq = (v: RGBVals, w: RGBVals): boolean => v.r == w.r && v.g == w.g && v.b == w.b
const add = (v: RGBVals, w: RGBVals, r?: number, g?: number, b?: number): RGBVals => ([r, g, b] = _.map(v, (val: number, key: keyof RGBVals) => val + w[key])) && { r, g, b }
const divRounded = (v: RGBVals, t: number, r?: number, g?: number, b?: number): RGBVals => ([r, g, b] = _.map(v, (val: number) => Math.round(val / t))) && { r, g, b }

const minDPos = (v: RGBVals, arr: RGBVals[]) => {
    let [minPos, minD] = [0, Infinity]
    for (let i = 0; i < arr.length; i++) {
        let currD = d(arr[i], v)
        if (currD < minD) [minPos, minD] = [i, currD]
    }
    return minPos
}
const getKey = (_: number, s: string) => (s == '0' ? 'r' : s == '1' ? 'g' : 'b') // [0, 1, 2] => [r, g, b]

const LindeBuzoGray = (centroids: Vector3[], data: Vector3[], epsilon: number, oldD: number, depth: number = 0): Vector3[] => {
    let pairings: number[] = Array.from({ length: data.length }, (_, i) => minDPos(data[i], centroids))

    let D = pairings.reduce((sum, centr, vec) => sum + Math.pow(d(centroids[centr], data[vec]), 2)) / data.length

    if (Math.abs((D - oldD) / D) < epsilon) {
        console.log('~ Iterations: ', depth)
        return pairings.map(centr => centroids[centr])
    }

    let newCentroids = _.map(_.invertBy(pairings), (vecs: number[]) =>
        divRounded(
            _.reduce(vecs, (sum: Vector3, vec: number) => add(sum, data[vec]), { r: 0, g: 0, b: 0 }),
            vecs.length
        )
    )
    return LindeBuzoGray(newCentroids, data, epsilon, D, depth + 1)
}

export const execute = (tgaData: Uint8Array, colors: number, epsilon: number): Uint8Array => {
    // PARSING
    console.time('Parsing time')
    let data_vecs: Vector3[] = _.map(_.chunk(tgaData, 4), (chunk: number[]) => _.mapKeys(_.dropRight(chunk), getKey))
    console.timeEnd('Parsing time')

    // STARTING CENTROIDS
    console.time('Sampling time')
    // let centroids = _.sampleSize(_.uniqWith(data_vecs, eq), 2 ** colors) // V1 - THIS HAS VERY BAD OPTIMIZATION

    let centroids: Vector3[] = []
    let set = _.uniqWith(data_vecs, eq)
    assert(set.length > 2 ** colors, 'OOPS - number of colors on image is less than or equal to ', _.uniqWith(data_vecs, eq).length, ' <= ', 2 ** colors, ' chosen number of divisions - so image wont change')
    if (set.length <= 2 ** colors) return tgaData
    else {
        for (let i = 0; i < 2 ** colors; i++) {
            let rand: Vector3, alreadyTaken
            do {
                rand = data_vecs[Math.floor(Math.random() * data_vecs.length)]
                alreadyTaken = centroids.some(val => eq(rand, val))
            } while (alreadyTaken)
            centroids.push(rand)
        }
        // V2 - THIS IS BETTER BUT FOR BIG NUMBER OF CENTROIDS AND NOT SO DIFFERENT COLORS IS GETTING STUCK SO I ADDED CHECK
    }
    console.timeEnd('Sampling time')

    // CALCULATION
    console.time('Quantization time')
    let result = LindeBuzoGray(centroids, data_vecs, epsilon, Infinity)
    console.timeEnd('Quantization time')

    let mse = _.reduce(result, (sum: number, centroid: RGBVals, vec: number) => sum + Math.pow(d(centroid, data_vecs[vec]), 2), 0) / data_vecs.length
    let snr = _.reduce(result, (sum: number, centroid: RGBVals, vec: number) => sum + Math.pow(centroid.r + centroid.g + centroid.b, 2), 0) / data_vecs.length
    snr = 10 * Math.log10(snr / mse)

    console.log('> MSE: ', Math.sqrt(mse))
    console.log('> SNR: ', snr)

    // PARSING BACK
    let result_buffer = new Uint8Array(_.flatten(_.map(result, (val: RGBVals) => [...Object.values(val), 255])))
    return result_buffer
}

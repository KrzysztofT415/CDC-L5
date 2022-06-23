const { readFile } = require('fs/promises')
const myPrompt = require('prompt')
const chalk = require('chalk')
const TGA = require('tga')

import CONFIG from './config'
import { writeToPng } from './utils'
import * as Quantization from './Quantization'

//
;(async () => {
    // SINGLE EXECUTION
    if (process.argv.slice(2).length > 0) {
        let [inputName, outputName, epsilon, colorBits] = process.argv.slice(2)
        let data = await readFile(inputName)
        const tga_img = new TGA(data)
        let processedData = Quantization.execute(tga_img.pixels, Number(colorBits), Number(epsilon)) // EXEC
        if (outputName !== undefined) writeToPng(outputName, processedData, tga_img.width, tga_img.height)
        return
    }

    myPrompt.start()
    readingInput: while (true) {
        // INPUT
        var { inputName } = await myPrompt.get(CONFIG.IN_FILE_NAME_PROPERTIES)
        if (inputName === '') return
        let colorBits_v, epsilon_v, outputName
        let fast = false
        if (inputName.split(' ').length > 2) {
            ;[fast, inputName, colorBits_v, epsilon_v, outputName] = [true, ...inputName.split(' ')]
            myPrompt.message = ''
            myPrompt.delimiter = ''
            CONFIG.IN_FILE_NAME_PROPERTIES[0].description = ' '
        }

        let data: any
        try {
            data = await readFile(inputName)
        } catch (exc) {
            console.log(exc, 'File not found')
            continue readingInput
        }

        if (!fast) {
            let { colorBits } = await myPrompt.get(CONFIG.COLOR_BITS_PROPERTIES)
            let { epsilon } = await myPrompt.get(CONFIG.EPSILON_PROPERTIES)
            colorBits_v = colorBits
            epsilon_v = epsilon
        }

        const tga_img = new TGA(data)

        // EXECUTION
        let processedData = Quantization.execute(tga_img.pixels, colorBits_v, epsilon_v)
        if (processedData == null) continue readingInput

        // OUTPUT

        if (!fast) outputName = await myPrompt.get(CONFIG.OUT_FILE_NAME_PROPERTIES)

        if (outputName !== '') writeToPng(outputName, processedData, tga_img.width, tga_img.height)
    }
})()

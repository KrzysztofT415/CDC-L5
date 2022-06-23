export default class CONFIG {
    static IN_FILE_NAME_PROPERTIES = [
        {
            name: 'inputName',
            description: 'Enter input file name',
            type: 'string'
        }
    ]
    static COLOR_BITS_PROPERTIES = [
        {
            name: 'colorBits',
            description: 'Enter number of bits for colors (2^n)',
            type: 'number'
        }
    ]
    static EPSILON_PROPERTIES = [
        {
            name: 'epsilon',
            description: 'Enter precision',
            type: 'number'
        }
    ]
    static OUT_FILE_NAME_PROPERTIES = [
        {
            name: 'outputName',
            description: 'Enter output file name',
            type: 'string'
        }
    ]
}

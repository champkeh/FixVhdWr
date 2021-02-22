const fs = require('fs')
const { VDISK_TYPE } = require('../const')
const HardDiskFooter = require('../structure/vhd/footer')
const { readBufferFromFile, readBufferFromFileToEnd, writeBufferToFile } = require('./utils')

/**
 * 解析虚拟磁盘文件的类型
 * @param vhdFile
 * @description 目前只支持 vhd 格式的文件
 */
function resolveVDiskType(vhdFile) {
    const footerBuffer = readFooterFromVDisk(vhdFile)
    const hdFooterJson = new HardDiskFooter(footerBuffer).toJSON()

    if (hdFooterJson.diskType === 'Fixed hard disk') {
        return VDISK_TYPE.VHD_FIXED
    } else if (hdFooterJson.diskType === 'Dynamic hard disk') {
        return VDISK_TYPE.VHD_DYNAMIC
    } else if (hdFooterJson.diskType === 'Differencing hard disk') {
        return VDISK_TYPE.VHD_DIFFERENCING
    } else {
        return VDISK_TYPE.UNKNOWN
    }
}

/**
 * 读取虚拟磁盘文件的Footer结构(最后512字节)
 * @param vhdFile
 */
function readFooterFromVDisk(vhdFile) {
    // todo: 这里需要根据虚拟磁盘文件格式读取对应位置的数据
    return readBufferFromFileToEnd(vhdFile, -512)
}


function checkVhdValid(footer) {
    // todo(champ): 这里尝试解析 vhd footer 结构，如果失败则说明不是合法的 vhd 文件
    return true
}

/**
 * 检测fixed类型的文件写入位置是否合法，避免覆盖掉最后的footer结构
 * @param vhdFile
 * @param data
 * @param offset
 * @return {boolean}
 */
function checkWritePositionValidForFixed(vhdFile, data, offset) {
    const tail = offset + data.length
    const footerStart = fs.statSync(vhdFile).size - 512
    return tail < footerStart
}

/**
 * 修复虚拟磁盘的启动扇区
 * @param vdisk
 */
function fixBootSector(vdisk) {
    const vdiskType = resolveVDiskType(vdisk)
    let bootSector = null
    if (vdiskType === VDISK_TYPE.VHD_FIXED) {
        // fixed disk: 启动扇区在最开始的512字节
        bootSector = readBufferFromFile(vdisk, 0, 512)
        bootSector[510] = 0x55
        bootSector[511] = 0xAA
        writeBufferToFile(vdisk, bootSector, 0)
    } else if (vdiskType === VDISK_TYPE.VHD_DYNAMIC) {
        // dynamic disk: 启动扇区在第一个block的第2个扇区
    }
}


module.exports = {
    readFooterFromVDisk,
    resolveVDiskType,
    checkWritePositionValidForFixed,
}

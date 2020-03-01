/* eslint-disable max-len */
const Crypto = require('crypto');
// TODO: Make it more configurable
module.exports = (fingerPrintHash, windowHash, windowProtoChainHash) => {
  fingerPrintHash = fingerPrintHash || Crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  windowHash = windowHash || Crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  windowProtoChainHash = windowProtoChainHash || Crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  return JSON.stringify([
    {
      key: 'api_type',
      value: 'js',
    },
    {
      key: 'p',
      value: 1,
    },
    {
      key: 'f',
      value: fingerPrintHash,
    },
    {
      key: 'n',
      value: Buffer.from(Math.round(Date.now() / 1000).toString()).toString('base64'),
    },
    {
      key: 'wh',
      value: `${windowHash}|${windowProtoChainHash}`,
    },
    {
      value: [
        'DNT:unknown',
        'L:en-US',
        'D:24',
        'PR:1',
        'S:1920,1080',
        'AS:1920,1040',
        'TO:-60',
        'SS:true',
        'LS:true',
        'IDB:true',
        'B:false',
        'ODB:true',
        'CPUC:unknown',
        'PK:Win32',
        'CFP:-1424337346',
        'FR:false',
        'FOS:false',
        'FB:false',
        'JSF:Arial,Arial Black,Arial Narrow,Calibri,Cambria,Cambria Math,Comic Sans MS,Consolas,Courier,Courier New,Georgia,Helvetica,Impact,Lucida Console,Lucida Sans Unicode,Microsoft Sans Serif,MS Gothic,MS PGothic,MS Sans Serif,MS Serif,Palatino Linotype,Segoe Print,Segoe Script,Segoe UI,Segoe UI Light,Segoe UI Semibold,Segoe UI Symbol,Tahoma,Times,Times New Roman,Trebuchet MS,Verdana,Wingdings',
        'P:Chrome PDF Plugin,Chrome PDF Viewer,Native Client',
        'T:0,false,false',
        'H:12',
        'SWF:false',
      ],
      key: 'fe',
    },
    {
      key: 'cs', // is canvas supported
      value: 1,
    },
    {
      key: 'jsbd',
      value: JSON.stringify({
        HL: 1,
        NCE: true,
        DMTO: 1,
        DOTO: 1,
      }),
    },
  ]);
};

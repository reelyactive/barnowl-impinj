/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const Raddec = require('raddec');


/**
 * ImpinjDecoder Class
 * Decodes data streams from one or more Impinj readers and forwards the
 * packets to the given BarnowlImpinj instance.
 */
class ImpinjDecoder {

  /**
   * ImpinjDecoder constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.barnowl = options.barnowl;
  }

  /**
   * Handle data from a given device, specified by the origin
   * @param {Buffer} data The data as a buffer.
   * @param {String} origin The unique origin identifier of the device.
   * @param {Number} time The time of the data capture.
   * @param {Object} decodingOptions The packet decoding options.
   */
  handleData(data, origin, time, decodingOptions) {
    let self = this;
    let raddecs = [];

    if(Array.isArray(data)) {
      raddecs = processIoTDeviceInterfaceData(data, origin, time,
                                              decodingOptions);
    }
    else {
      // TODO: processSpeedwayConnectData()
    }

    raddecs.forEach(function(raddec) {
      self.barnowl.handleRaddec(raddec);
    });
  }
}


/**
 * Process IoT Device Interface data
 * @param {Buffer} data The data as a buffer.
 * @param {String} origin The unique origin identifier of the device.
 * @param {Number} time The time of the data capture.
 * @param {Object} decodingOptions The packet decoding options.
 */
function processIoTDeviceInterfaceData(data, origin, time, decodingOptions) {
  let raddecs = [];

  data.forEach(event => {
    let isTagInventory = (event.eventType === 'tagInventory') &&
                         event.hasOwnProperty('tagInventoryEvent');

    if(isTagInventory) {
      let tagInventoryEvent = event.tagInventoryEvent;
      let hasTid = tagInventoryEvent.hasOwnProperty('tidHex') ||
                   tagInventoryEvent.hasOwnProperty('tid');
      let hasEpc = tagInventoryEvent.hasOwnProperty('epcHex') ||
                   tagInventoryEvent.hasOwnProperty('epc');

      if(hasTid || hasEpc) {
        let transmitterId;
        let transmitterIdType = Raddec.identifiers.TYPE_UNKNOWN;

        if(hasEpc) {
          let epcHex = tagInventoryEvent.epcHex ||
                       Buffer.from(tagInventoryEvent.epc, 'base64')
                             .toString('hex');
          transmitterId = epcHex.toLowerCase();
          if((transmitterId.length / 2) ===
             Raddec.identifiers.lengthInBytes(Raddec.identifiers.TYPE_EPC96)) {
            transmitterIdType = Raddec.identifiers.TYPE_EPC96;
          }
        }
        else if(hasTid) {
          let tidHex = tagInventoryEvent.tidHex ||
                       Buffer.from(tagInventoryEvent.tid, 'base64')
                             .toString('hex');
          transmitterId = tidHex.toLowerCase();
          if((transmitterId.length / 2) ===
             Raddec.identifiers.lengthInBytes(Raddec.identifiers.TYPE_TID96)) {
            transmitterIdType = Raddec.identifiers.TYPE_TID96;
          }
        }

        let hostnameElements = event.hostname.split('-');
        let receiverId = '001625' + hostnameElements[1] +
                         hostnameElements[2] + hostnameElements[3];
        let raddec = new Raddec({
            transmitterId: transmitterId,
            transmitterIdType: transmitterIdType,
            rssiSignature: [{
                receiverId: receiverId,
                receiverIdType: Raddec.identifiers.TYPE_EUI48,
                rssi: Math.round(tagInventoryEvent.peakRssiCdbm / 100)
            }],
            packets: [],
            timestamp: new Date(tagInventoryEvent.lastSeenTime).getTime()
        });

        raddecs.push(raddec);
      }
    }
  });

  return raddecs;
}


module.exports = ImpinjDecoder;

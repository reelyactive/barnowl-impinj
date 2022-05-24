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

    if(!Array.isArray(data)) {
      return; // TODO: does legacy protocol use Object rather than Array?
    }

    let raddecs = [];

    data.forEach(event => {
      let isTagInventory = (event.eventType === 'tagInventory') &&
                           event.hasOwnProperty('tagInventoryEvent');

      if(isTagInventory) {
        let tagInventoryEvent = event.tagInventoryEvent;
        let hostnameElements = event.hostname.split('-');
        let receiverId = '001625' + hostnameElements[1] +
                         hostnameElements[2] + hostnameElements[3];
        let raddec = new Raddec({
            transmitterId: tagInventoryEvent.tidHex.toLowerCase(),
            transmitterIdType: Raddec.identifiers.TYPE_UNKNOWN, // TODO
            rssiSignature: [{
                receiverId: receiverId,
                receiverIdType: Raddec.identifiers.TYPE_EUI48,
                rssi: Math.round(tagInventoryEvent.peakRssiCdbm / 100)
            }],
            packets: [ tagInventoryEvent.epcHex.toLowerCase() ],
            timestamp: new Date(tagInventoryEvent.lastSeenTime).getTime()
        });

        raddecs.push(raddec);
      }
    });

    raddecs.forEach(function(raddec) {
      self.barnowl.handleRaddec(raddec);
    });
  }
}


module.exports = ImpinjDecoder;

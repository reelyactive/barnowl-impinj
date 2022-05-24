/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS = 1000;
const DEFAULT_RSSI = -7000;
const MIN_RSSI = -8000;
const MAX_RSSI = -6000;
const RSSI_RANDOM_DELTA = 500;
const TEST_ORIGIN = 'test';


/**
 * TestListener Class
 * Provides a consistent stream of artificially generated packets.
 */
class TestListener {

  /**
   * TestListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.decoder = options.decoder;
    this.radioDecodingPeriod = options.radioDecodingPeriod ||
                               DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS;
    this.rssi = [ DEFAULT_RSSI ];
    this.decodingOptions = options.decodingOptions || {};

    setInterval(emitRadioDecodings, this.radioDecodingPeriod, this);
  }

}


/**
 * Emit simulated radio decoding packets
 * @param {TestListener} instance The given instance.
 */
function emitRadioDecodings(instance) {
  let now = new Date();
  let simulatedTagEvent = {
      timestamp: now.toISOString(),
      hostname: "impinj-01-23-45",
      eventType: "tagInventory",
      tagInventoryEvent: {
        epc: "ftqQOAUQAnEAAsCu",
        epcHex: "7EDA9038051002710002C0AE",
        tid: "4oARcCAAFM2bWgjs",
        tidHex: "E2801170200014CD9B5A08EC",
        pc: "NAA=",
        antennaPort: 1,
        antennaName: "ANTENNA-NAME",
        peakRssiCdbm: instance.rssi[0],
        frequency: 927250,
        transmitPowerCdbm: 3000,
        lastSeenTime: now.toISOString(),
        phaseAngle: 69.00
      }
  };

  updateSimulatedRssi(instance);
  instance.decoder.handleData([ simulatedTagEvent ], TEST_ORIGIN, now.getTime(),
                              instance.decodingOptions);
}


/**
 * Update the simulated RSSI values
 * @param {TestListener} instance The given instance.
 */
function updateSimulatedRssi(instance) {
  for(let index = 0; index < instance.rssi.length; index++) {
    instance.rssi[index] += Math.floor((Math.random() * RSSI_RANDOM_DELTA) -
                                       (RSSI_RANDOM_DELTA / 2));
    if(instance.rssi[index] > MAX_RSSI) {
      instance.rssi[index] = MAX_RSSI;
    }
    else if(instance.rssi[index] < MIN_RSSI) {
      instance.rssi[index] = MIN_RSSI;
    }
  }
}


module.exports = TestListener;

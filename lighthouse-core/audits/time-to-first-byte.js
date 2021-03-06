/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const i18n = require('../lib/i18n');

const UIStrings = {
  title: 'Server response times are low (TTFB)',
  failureTitle: 'Reduce server response times (TTFB)',
  description: 'Time To First Byte identifies the time at which your server sends a response.' +
    ' [Learn more](https://developers.google.com/web/tools/lighthouse/audits/ttfb).',
  /** [ICU Syntax] Used to summarize the total Time to First Byte duration for the primary HTML response */
  displayValue: `Root document took {timeInMs, number, milliseconds}\xa0ms`,
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

const TTFB_THRESHOLD = 600;

class TTFBMetric extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'time-to-first-byte',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'URL'],
    };
  }

  /**
   * @param {LH.Artifacts.NetworkRequest} record
   */
  static caclulateTTFB(record) {
    const timing = record.timing;
    return timing ? timing.receiveHeadersEnd - timing.sendEnd : 0;
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const mainResource = await artifacts.requestMainResource({devtoolsLog, URL: artifacts.URL});

    const ttfb = TTFBMetric.caclulateTTFB(mainResource);
    const passed = ttfb < TTFB_THRESHOLD;
    const displayValue = str_(UIStrings.displayValue, {timeInMs: ttfb});

    /** @type {LH.Result.Audit.OpportunityDetails} */
    const details = {
      type: 'opportunity',
      overallSavingsMs: ttfb - TTFB_THRESHOLD,
      headings: [],
      items: [],
    };

    return {
      rawValue: ttfb,
      score: Number(passed),
      displayValue,
      details,
      extendedInfo: {
        value: {
          wastedMs: ttfb - TTFB_THRESHOLD,
        },
      },
    };
  }
}

module.exports = TTFBMetric;
module.exports.UIStrings = UIStrings;

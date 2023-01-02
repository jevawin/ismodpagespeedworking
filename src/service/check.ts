// Lower case hasOwnProperty function
const hasOwnPropertyCI = (object: object, prop: string) => {
  return Object.keys(object)
    .filter((v: string) => {
      return v.toLowerCase() === prop.toLowerCase();
    }).length > 0;
};

// Helper function to neaten headers so we can return them
const formatHeaders = (sts: number, msg: string, hds: object) => {
  return Object.assign({ [sts]: msg }, hds);
};

const pageSpeedCheck = async (checkurl: string, checkua: string) => {
  if (!checkurl || !checkua) {
    return "$.handleResponse('[-1]');";
  } else {
    // -1 = error connecting, 0 = connected no mod_pagespeed, 1 = connected with mod_pagespeed
    let mps: number = -1;
    let out: Array<string | number | object> = [];
    let url: string = decodeURI(checkurl);
    let loc: string = /^https?/i.test(url) ? url : "https://" + url;
    let ua: string = decodeURI(checkua);
    let options = {
      headers: {
        "User-Agent": ua,
      },
    };

    // Run once to allow mod_pagespeed to cache URL
    const presponse = await fetch(loc, options);

    const response = await fetch(presponse.url, options);
    const headers = Object.fromEntries(response.headers.entries());

    if (response.ok && response.status === 200) {
      // We connected so set mps to 0
      mps = 0;

      // Look for 'x-mod-pagespeed' or 'x-page-speed' in the headers
      if (hasOwnPropertyCI(headers, "x-mod-pagespeed")) mps = 1;
      if (hasOwnPropertyCI(headers, "x-page-speed")) mps = 1;

      // Push final headers
      out.push(formatHeaders(response.status, response.statusText, headers));
      // out.push({ [response.status]: response.headers.toString() });
    }

    // Add final location to output
    out.unshift(response.url);

    // Add mps/error state to output
    out.unshift(mps);

    // Convert to JSON
    let outJSON: string = encodeURIComponent(JSON.stringify(out));

    // Return response inside handleResponse function so it's invoked on load
    return `$.handleResponse('${outJSON}');`;
  }
}

export default pageSpeedCheck;
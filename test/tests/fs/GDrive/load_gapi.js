const loadScript = (url, attr) => {
  const elem = document.createElement('script');
  elem.src = url;
  elem.setAttribute('async', '');
  if (attr) {
    Object.keys(attr).forEach(key => {
      elem.setAttribute(key, attr[key]);
    });
  }
  const p = new Promise((resolve) => {
    elem.onload = resolve;
  });
  document.body.appendChild(elem);
  return p;
};

window.gapiLoaded = loadScript("https://apis.google.com/js/api.js");

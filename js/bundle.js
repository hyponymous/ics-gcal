
function getBody() {
  return document.getElementsByTagName('body')[0];
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();      
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function linkFromIcsText(text) {
  const lines = text.split(/\r?\n/);
  const endIndex = lines.findIndex(line => line.match(/^END:VEVENT$/));
  const eventData = lines.slice(0, endIndex).reduce((memo, line) => {
    if (line.match(/^ /)) {
      if (!memo.hasOwnProperty('desc')) {
        throw new Error('Found multiline without "DESCRIPTION"');
      }
      memo.desc.push(line.slice(1));
    } else {
      const [field, ...rest] = line.split(':');
      const value = rest.join(':');

      switch (field) {
        case 'DESCRIPTION':
          memo.desc = [];
          memo.desc.push(value);
          break;
        case 'SUMMARY':
          memo.summary = value;
          break;
        case 'DTSTART':
          memo.start = value;
          break;
        case 'DTEND':
          memo.end = value;
          break;
        case 'LOCATION':
          memo.location = value;
          break;
      }
    }
    return memo;
  }, {});
  eventData.desc = eventData.desc
      .join('')
      .replace(/\\n/g, '\n')
      .replace(/\\/g, '');

  const dateStr = `${eventData.start}/${eventData.end}`;
  return [
    'https://www.google.com/calendar/render?action=TEMPLATE',
    `dates=${encodeURIComponent(dateStr)}`,
    `text=${encodeURIComponent(eventData.summary)}`,
    `location=${encodeURIComponent(eventData.location)}`,
    `details=${encodeURIComponent(eventData.desc)}`
  ].join('&');
}

function dropHandler(e) {
  getBody().style.backgroundColor = '';
  e.preventDefault();

  const dt = e.dataTransfer;
  if (dt.items) {
    // Use DataTransferItemList interface to access the file(s)
    Array.from(dt.items)
    .filter((item) => {
      return item.kind === 'file';
    })
    .slice(0, 1)
    .forEach((item) => {
      const file = item.getAsFile();
      readFile(file)
          .then(linkFromIcsText)
          .then((link) => {
            window.location = link;
          });
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    Array.from(dt.files)
    .slice(0, 1)
    .forEach((file) => {
      readFile(file)
          .then(linkFromIcsText)
          .then((link) => {
            window.location = link;
          });
    });
  }
}

function dragoverHandler(e) {
  getBody().style.backgroundColor = 'rgba(255, 0, 153, .2)';
  e.preventDefault();
}

function dragendHandler(e) {
  getBody().style.backgroundColor = '';
  e.preventDefault();
}

// lint
(() => {})(dropHandler, dragoverHandler, dragendHandler);


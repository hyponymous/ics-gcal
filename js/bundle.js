((body) => {

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

  function eventStrsFromIcsText(icsText) {
    return icsText.split('END:VEVENT');
  }

  function linkFromEventStr(eventStr) {
    const lines = eventStr.replace(/\r?\n /g, '').split(/\r?\n/);
    const endIndex = lines.findIndex(line => line.match(/^END:VEVENT$/));
    const eventData = lines.slice(0, endIndex).reduce((memo, line) => {
      const [field, ...rest] = line.split(':');
      const value = rest.join(':');

      switch (field) {
        case 'DESCRIPTION':
          memo.desc = value;
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
      return memo;
    }, {});
    eventData.desc = eventData.desc
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

  function openLinkInIcsFile(icsFile) {
    readFile(icsFile)
        .then(eventStrsFromIcsText)
        .then(strs => strs[0])
        .then(linkFromEventStr)
        .then((link) => {
          window.location = link;
        })
        .catch((err) => {
          // TODO display error
          console.error(err);
        });
  }

  function dropHandler(e) {
    body.classList.remove('drag');
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
        openLinkInIcsFile(file);
      });
    } else {
      // Use DataTransfer interface to access the file(s)
      Array.from(dt.files)
      .slice(0, 1)
      .forEach((file) => {
        openLinkInIcsFile(file);
      });
    }
  }

  body.onload = () => {
    body.ondrop = dropHandler;
    body.ondragover = (e) => {
      body.classList.add('drag');
      e.preventDefault();
    };
    body.ondragleave = (e) => {
      body.classList.add('drag');
      e.preventDefault();
    };
  };

})(document.getElementsByTagName('body')[0]);

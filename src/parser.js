const parserFn = (response, idFn = '') => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data.contents, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('errorMessage.urlInValid');
  }
  const obj = {
    title: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
  };

  const items = [...doc.querySelectorAll('item')].map((item) => {
    const title = item.querySelector('title').textContent;
    const id = idFn ? idFn() : '';
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    return {
      id,
      title,
      description,
      link,
    };
  });
  return [obj, items];
};

export default parserFn;

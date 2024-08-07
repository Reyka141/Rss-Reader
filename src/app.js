import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId.js';
import watch from './view.js';
import resources from './locales/index.js';

const routes = {
  rssPath: (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`,
};

const parserFn = (response) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data.contents, 'application/xml');
  const items = [...doc.querySelectorAll('item')].map((item) => {
    const id = uniqueId();
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    return {
      id,
      title,
      description,
      link,
    };
  });
  return {
    title: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
    items,
  };
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    button: document.querySelector('[type=submit]'),
  };

  const defaultLang = 'ru';

  const state = {
    status: 'filling', // 'sending', 'sent', 'error'
    valid: false,
    errors: [],
    loadedFeeds: [],
    contents: {},
  };

  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLang,
    debug: false,
    resources,
  }).then((t) => {
    yup.setLocale({
      mixed: {
        required: 'errorMessage.required',
        notOneOf: 'errorMessage.urlNotOneOf',
      },
      string: {
        url: 'errorMessage.url',
      },
    });
    const watchedState = watch(elements, state, t);

    elements.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const schema = yup.object().shape({
        url: yup.string()
          .required()
          .url()
          .notOneOf(watchedState.loadedFeeds),
      });
      const formData = new FormData(e.target);
      const newRss = Object.fromEntries(formData);
      console.log(newRss.url);
      schema.validate(newRss, { abortEarly: false })
        .then(() => {
          watchedState.status = 'sending';
          return axios.get(routes.rssPath(newRss.url));
        })
        .then((response) => {
          watchedState.contents = parserFn(response);
          watchedState.status = 'filling';
          watchedState.errors = [];
          watchedState.loadedFeeds.push(newRss.url);
          watchedState.valid = true;
          // return new DOMParser();
        })
        .then((value) => console.log(value))
        .catch((err) => {
          const validateError = err.inner.reduce((acc, cur) => {
            const { path, message } = cur;
            const errorData = acc[path] || [];
            return { ...acc, [path]: [...errorData, message] };
          }, {});
          watchedState.errors = validateError;
        });
    });
  });
};

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
  return doc;
};

const createFeeds = (doc) => {
  const obj = {
    title: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
    lastBuildDate: doc.querySelector('lastBuildDate').textContent,
  };
  return obj;
};

const createPosts = (doc, idFn = '') => {
  const items = [...doc.querySelectorAll('item')].map((item) => {
    const title = item.querySelector('title').textContent;
    const id = idFn === '' ? idFn : idFn();
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    const pubDate = item.querySelector('pubDate').textContent;
    return {
      id,
      pubDate,
      title,
      description,
      link,
    };
  });
  return items;
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    button: document.querySelector('[type=submit]'),
    posts: document.querySelector('.posts'),
    postEl: {},
    feeds: document.querySelector('.feeds'),
  };

  const defaultLang = 'ru';

  const state = {
    status: 'filling', // 'sending', 'sent', 'error'
    valid: false,
    errors: [],
    loadedFeeds: [],
    contents: {
      feeds: [],
      posts: [],
    },
    newPosts: [],
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
    const setTime = () => {
      const timerId = setTimeout(() => {
        const arr = watchedState.loadedFeeds.map((url) => axios.get(routes.rssPath(url)));
        Promise.all(arr).then((data) => {
          const idLists = watchedState.contents.posts.map(({ title }) => title);
          const items = data
            .flatMap((item) => {
              const doc = parserFn(item);
              const arrOfPosts = createPosts(doc);
              return arrOfPosts;
            })
            .filter((item) => !idLists.includes(item.title))
            .map((item) => {
              const id = uniqueId();
              return { ...item, id };
            });
          if (items.length > 0) {
            watchedState.contents.posts = [...items, ...watchedState.contents.posts];
          }
        })
          .then(() => {
            setTime();
          })
          .catch(() => clearInterval(timerId));
      }, 5000);
    };
    setTime();

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

      schema.validate(newRss, { abortEarly: false })
        .then(() => {
          watchedState.status = 'sending';
          return axios.get(routes.rssPath(newRss.url));
        })
        .then((response) => {
          if (response.data.status.http_code === 200) {
            const doc = parserFn(response);
            watchedState.contents.feeds.unshift(createFeeds(doc));
            watchedState.contents.posts = [
              ...createPosts(doc, uniqueId),
              ...watchedState.contents.posts,
            ];
            watchedState.errors = [];
            watchedState.loadedFeeds.push(newRss.url);
            watchedState.valid = true;
          } else {
            const error = { url: 'errorMessage.urlInValid' };
            watchedState.errors = error;
          }
          watchedState.status = 'filling';
        })
        .catch((err) => {
          const validateError = err.inner.reduce((acc, cur) => {
            const { path, message } = cur;
            return { ...acc, [path]: message };
          }, {});
          watchedState.errors = validateError;
        });
    });
  });
};

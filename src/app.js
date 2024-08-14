import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId.js';
import watch from './view.js';
import resources from './locales/index.js';
import parserFn from './parser.js';

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    btnSubmit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    button: document.querySelector('[type=submit]'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modalElements: {
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      modalBtn: document.querySelector('.full-article'),
    },
  };

  const defaultLang = 'ru';
  const fetchInterval = 5000;

  const state = {
    status: 'filling',
    valid: false,
    errors: '',
    loadedFeeds: [],
    contents: {
      feeds: [],
      posts: [],
      postVisited: [],
    },
    modalIcon: {
      title: '',
      description: '',
      href: '',
      idPost: '',
    },
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

    const getNewPosts = () => {
      const idLists = watchedState.contents.posts.map(({ title }) => title);
      const arr = watchedState.loadedFeeds.map((url) => {
        const result = axios.get(addProxy(url))
          .then((data) => {
            const [, arrOfPosts] = parserFn(data);
            const newPosts = arrOfPosts
              .filter((item) => !idLists.includes(item.title))
              .map((item) => {
                const id = uniqueId();
                return { ...item, id };
              });
            if (newPosts.length > 0) {
              watchedState.contents.posts = [...newPosts, ...watchedState.contents.posts];
            }
          });
        return result;
      });
      Promise.all(arr).finally(() => {
        setTimeout(() => getNewPosts(), fetchInterval);
      });
    };
    getNewPosts();

    elements.btnSubmit.addEventListener('click', (e) => {
      e.preventDefault();

      const schema = yup.object().shape({
        url: yup.string()
          .required()
          .url()
          .notOneOf(watchedState.loadedFeeds),
      });

      const formData = new FormData(elements.form);
      const newRss = Object.fromEntries(formData);

      schema.validate(newRss, { abortEarly: false })
        .then(() => {
          watchedState.status = 'sending';
          return axios.get(addProxy(newRss.url), {
            timeout: 5000,
          });
        })
        .then((response) => {
          if (response.status === 200) {
            const [feeds, posts] = parserFn(response, uniqueId);
            watchedState.contents.feeds.unshift(feeds);
            watchedState.contents.posts = [
              ...posts,
              ...watchedState.contents.posts,
            ];
            watchedState.errors = [];
            watchedState.loadedFeeds.push(newRss.url);
            watchedState.valid = true;
          } else {
            throw new Error('errorMessage.urlInValid');
          }
          watchedState.status = 'filling';
        })
        .catch((err) => {
          if (err.message === 'timeout of 5000ms exceeded') {
            watchedState.errors = 'errorMessage.timeout';
          } else {
            const { message } = err;
            watchedState.errors = message;
          }
          watchedState.status = 'filling';
        });
    });
  });
};

import * as yup from 'yup';
import i18next from 'i18next';
import watch from './view.js';
import resources from './locales/index.js';

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
  };
  const defaultLang = 'ru';
  const state = {
    status: 'filling',
    valid: false,
    errors: [],
    loadedFeeds: [],
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
      schema.validate(newRss, { abortEarly: false })
        .then(() => {
          watchedState.errors = [];
          watchedState.loadedFeeds.push(newRss.url);
          watchedState.valid = true;
        })
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

import * as yup from 'yup';
import watch from './view.js';

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
  };

  const state = {
    status: 'filling',
    valid: false,
    errors: [],
    loadedFeeds: [],
  };

  const watchedState = watch(elements, state);

  elements.form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const schema = yup.object().shape({
      url: yup.string()
        .required()
        .url('Ссылка должна быть валидным URL')
        .notOneOf(watchedState.loadedFeeds, 'RSS уже существует'),
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
};

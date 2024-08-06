import onChange from 'on-change';

export default (elements, state, i18n) => {
  const { input, feedback, form } = elements;
  const handleErrors = () => {
    if (!state.errors.url) {
      input.classList.remove('is-invalid');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18n('errorMessage.urlValid');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = state.errors.url;
    }
  };

  const formReset = () => {
    form.reset();
    input.focus();
  };

  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'form.status':
        break;
      case 'errors':
        handleErrors();
        break;
      case 'valid':
        handleErrors();
        formReset();
        break;
      default:
        break;
    }
  });

  return watchedState;
};

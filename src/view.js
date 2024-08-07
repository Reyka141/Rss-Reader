import onChange from 'on-change';

export default (elements, state, i18n) => {
  const {
    input, feedback, form,
    button,
  } = elements;
  const handleErrors = () => {
    if (!state.errors.url) {
      input.classList.remove('is-invalid');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18n('errorMessage.urlValid');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = i18n(state.errors.url);
    }
  };

  const formReset = () => {
    form.reset();
    input.focus();
  };

  const formSending = () => {
    input.disabled = true;
    button.disabled = true;
  };

  const formFilling = () => {
    input.disabled = false;
    button.disabled = false;
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'status':
        if (value === 'sending') {
          formSending();
        }
        if (value === 'filling') {
          formFilling();
        }
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

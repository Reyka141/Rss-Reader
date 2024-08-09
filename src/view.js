import onChange from 'on-change';

export default (elements, state, i18n) => {
  const {
    input, feedback, form,
    button, posts, feeds,
    postEl,
  } = elements;

  const createTitles = (textCode) => {
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('card-body');

    const title = document.createElement('h2');
    title.classList.add('card-title', 'h4');
    title.textContent = i18n(textCode);

    titleDiv.append(title);
    return titleDiv;
  };

  const createPosts = (items) => {
    const arrOFList = items.map((item) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      const a = document.createElement('a');
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.classList.add('fw-bold');
      a.setAttribute('data-id', item.id);
      a.textContent = item.title;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      btn.setAttribute('data-id', item.id);
      btn.setAttribute('data-bs-toggle', 'modal');
      btn.setAttribute('data-bs-target', '#modal');
      btn.textContent = i18n('posts.button');

      li.append(a, btn);
      return li;
    });
    return arrOFList;
  };

  const createFeeds = (data) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const liTitle = document.createElement('h3');
    liTitle.classList.add('h6', 'm-0');
    liTitle.textContent = data.title;

    const liDecription = document.createElement('p');
    liDecription.classList.add('m-0', 'small', 'text-black-50');
    liDecription.textContent = data.description;

    li.append(liTitle, liDecription);
    return li;
  };

  const handlePosts = (container) => {
    const localContainer = container;
    localContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('card', 'border-0');

    const body = createTitles('posts.title');
    wrapper.append(body);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');

    const postContent = createPosts(state.contents.posts);
    postContent.forEach((post) => ul.append(post));

    wrapper.append(ul);
    localContainer.append(wrapper);
  };

  const handleFeeds = (container) => {
    const localContainer = container;
    localContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('card', 'border-0');

    const body = createTitles('feeds');

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');

    state.contents.feeds.forEach((content) => {
      const feedsContent = createFeeds(content);
      ul.append(feedsContent);
    });

    wrapper.append(body, ul);
    localContainer.append(wrapper);
  };

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

  const initialElements = () => {
    postEl.postList = document.querySelector('.posts ul');
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
      case 'contents.posts':
        handlePosts(posts);
        initialElements();
        break;
      case 'contents.feeds':
        handleFeeds(feeds);
        formReset();
        break;
      default:
        break;
    }
  });

  return watchedState;
};

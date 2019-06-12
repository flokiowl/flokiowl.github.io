var allPost = document.querySelector('.blog__button');
var blogList = document.querySelector('.blog__list');

allPost.addEventListener('click', function() {
	blogList.classList.toggle('blog__list--open');
	if (blogList.classList.contains('blog__list--open')) {
		allPost.innerHTML = "Hide Post";
	} else {
		allPost.innerHTML = "All Post";
	}
})
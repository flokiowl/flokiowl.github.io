'use strict'

var client1 = document.querySelector('.client1');
var client2 = document.querySelector('.client2');
var client3 = document.querySelector('.client3');

var button1 = document.querySelector('.reviews__button--first');
var button2 = document.querySelector('.reviews__button--second');
var button3 = document.querySelector('.reviews__button--third');


button1.addEventListener('click', function(evt) {
	evt.preventDefault();
	client1.style.left = '0';
	client2.style.left = '100' + '%';
	client3.style.left = '200' + '%';
	button1.classList.add('active');
	button2.classList.remove('active');
	button3.classList.remove('active');
})
button2.addEventListener('click', function() {
	client1.style.left = '-200' + '%';
	client2.style.left = '-100' + '%';
	client3.style.left = '0' + '%';
	button2.classList.add('active');
	button1.classList.remove('active');
	button3.classList.remove('active');
})
button3.addEventListener('click', function() {
	client1.style.left = '-400' + '%';
	client2.style.left = '-300' + '%';
	client3.style.left = '-200' + '%';
	button3.classList.add('active');
	button1.classList.remove('active');
	button2.classList.remove('active');
})



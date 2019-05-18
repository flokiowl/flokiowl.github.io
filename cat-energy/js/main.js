'use strict';

//menu

var navMenu = document.querySelector('.page-header__nav');
var navToggle = document.querySelector('.page-header__toggle');

navMenu.classList.remove('page-header__nav--nojs');

navToggle.addEventListener('click', function() {
    navMenu.classList.toggle('page-header__nav--opened');
});


//sliders

var docWidth    = document.body.clientWidth;
var tabletWidth = 768;

var imgBefore   = document.querySelector('.slider__image--before');
var imgAfter    = document.querySelector('.slider__image--after');

var btnBefore   = document.querySelector('.slider__button-prev');
var btnAfter    = document.querySelector('.slider__button-next');

var sliderSwitch = document.querySelector('.slider__switch');
var range       = document.querySelector('.slider__range');

         //mobile slider

btnAfter.addEventListener('click', function (evt) {
    evt.preventDefault();
    sliderSwitch.classList.add('to-right');
    sliderSwitch.classList.remove('to-left');
    imgBefore.classList.remove('slider__item--active');
    imgAfter.classList.add('slider__item--active');
});

btnBefore.addEventListener('click', function (evt) {
    evt.preventDefault();
    sliderSwitch.classList.remove('to-right');
    sliderSwitch.classList.add('to-left');
    imgBefore.classList.add('slider__item--active');
    imgAfter.classList.remove('slider__item--active');
});

sliderSwitch.addEventListener('click', function (evt) {
    evt.preventDefault();
    sliderSwitch.classList.toggle('to-right');
    sliderSwitch.classList.toggle('to-left');
    imgBefore.classList.toggle('slider__item--active');
    imgAfter.classList.toggle('slider__item--active');
});

            //tablet slider

if (docWidth >= tabletWidth) {
    btnBefore.addEventListener('click', function () {
            imgBefore.style.width = '100%';
            imgAfter.style.width = '0%';
            range.value = 0;
    });

    btnAfter.addEventListener('click', function () {
            imgBefore.style.width = '0%';
            imgAfter.style.width = '100%';
            range.value = 100;
    });

     range.addEventListener('input', function() {
            imgBefore.style.width = (100 - range.value) + '%';
            imgAfter.style.width = range.value + '%';
    });
}


//google-map API

var myLatLng = {lat: 59.93878426, lng: 30.32321191};
var centerLatLng = {lat:59.93878226, lng: 30.32252549};
var image = "../img/map-marker.svg";

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: centerLatLng,
        zoom: 18,
        panControl: false,
        zoomControl: false,
        scaleControl: false
    });

    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: 'ул. Большая Конюшенная, д. 19/8',
        icon: image,
        animation: google.maps.Animation.BOUNCE
      });
}

//form submit

document.querySelector('.form__btn').addEventListener("click", function(){
    document.querySelector('.form').classList.add('submitted')
});

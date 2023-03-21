jQuery(function(){
	"use strict";

	kioto_tm_my_load();
	// here all ready functions
	
	kioto_tm_trigger_menu();
	kioto_tm_nav_bg();
	kioto_tm_about_dimension();
	kioto_tm_modalbox_news();
	kioto_tm_cursor();
	// kioto_tm_imgtosvg();
	kioto_tm_popup();
	kioto_tm_data_images();
	kioto_tm_contact_form();
	kioto_tm_totop();

	
	jQuery(window).on('scroll',function(){
		kioto_tm_hero_effect();
		kioto_tm_progress_line();
	});
	
});

// -----------------------------------------------------
// ---------------   FUNCTIONS    ----------------------
// -----------------------------------------------------

// -----------------------------------------------------
// ---------------   TRIGGER MENU    -------------------
// -----------------------------------------------------

function kioto_tm_trigger_menu(){
	
	"use strict";

	var audio1			= jQuery('#audio1');
	var audio2			= jQuery('#audio2');
	var hamburger 		= jQuery('.trigger .hamburger');
	var list			= jQuery('.toky_tm_topbar .list ul li');
	var mobileMenu		= jQuery('.kioto_tm_mobile_menu .dropdown');
	var mobileMenuList	= jQuery('.kioto_tm_mobile_menu .dropdown .dropdown_inner ul li a');

	hamburger.on('click',function(){
		var element 	= jQuery(this);

		if(element.hasClass('is-active')){
			element.removeClass('is-active');
			audio1[0].play();
			list.removeClass('opened');
			mobileMenu.slideUp();
		}else{
			element.addClass('is-active');
			audio2[0].play();
			list.each(function(i){
				var ele = jQuery(this);
				setTimeout(function(){ele.addClass('opened');},i*50);
			});
			mobileMenu.slideDown();
		}
		return false;
	});
	
	mobileMenuList.on('click',function(){
		jQuery('.trigger .hamburger').removeClass('is-active');
		mobileMenu.slideUp();
		return false;
	});
}

// -----------------------------------------------------
// --------------   TOPBAR BACKGROUND    ---------------
// -----------------------------------------------------

function kioto_tm_nav_bg(){
	
	"use strict";

	jQuery(window).on('scroll',function(){
		var topbar	 		= jQuery('.toky_tm_topbar');
		var progress	 	= jQuery('.progressbar');
		var WinOffset		= jQuery(window).scrollTop();

		if(WinOffset >= 100){
			topbar.addClass('animate');
			progress.addClass('animate');
		}else{
			topbar.removeClass('animate');
			progress.removeClass('animate');
		}
	});
}

// -------------------------------------------------
// -------------------  ANCHOR ---------------------
// -------------------------------------------------

jQuery('.anchor_nav').onePageNav();

// -----------------------------------------------------
// ---------------   HERO EFFECT    --------------------
// -----------------------------------------------------

function kioto_tm_hero_effect(){
	
	"use strict";
		
	var scrollCurrent = window.pageYOffset;
	var scrollOpacity = 1 - (scrollCurrent / 350);        
	jQuery(".kioto_tm_hero").css({opacity: scrollOpacity });

}

function kioto_tm_about_dimension(){
	
	"use strict";
		
	var about	= jQuery('.kioto_tm_about');
	var hero	= jQuery('.kioto_tm_hero').height();
	about.css({marginTop: hero+'px'});
}

// -----------------------------------------------------
// ---------------   PRELOADER   -----------------------
// -----------------------------------------------------

function kioto_tm_preloader(){
	"use strict";
	
	var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? true : false;
	var preloader = $('#preloader');
	
	if (!isMobile) {
	
		setTimeout(function() {
			preloader.addClass('preloaded');
		}, 200);
		setTimeout(function() {
			preloader.remove();
		}, 2000);

	} else {
		preloader.remove();
	}
}

// -------------------------------------------------
// -------------  MODALBOX NEWS  -------------------
// -------------------------------------------------

function kioto_tm_modalbox_news(){
	
	"use strict";
	
	var modalBox	= jQuery('.kioto_tm_modalbox_news');
	var list 		= jQuery('.kioto_tm_news ul li');
	var closePopup	= modalBox.find('.close');
	
	list.each(function(){
		var element 	= jQuery(this);
		var details 	= element.find('.list_inner').html();
		var buttons 	= element.find('.details a,.kioto_tm_full_link');
		var mainImage	= element.find('.main');
		var imgData		= mainImage.data('img-url');
		var title		= element.find('.title');
		var titleHref	= element.find('.title a').html();
		buttons.on('click',function(){
			jQuery('body').addClass('modal');
			modalBox.addClass('opened');
			modalBox.find('.description_wrap').html(details);
			mainImage = modalBox.find('.main');
			mainImage.css({backgroundImage: 'url('+imgData+')'});
			title = modalBox.find('.title');
			title.html(titleHref);
			return false;
		});
	});
	closePopup.on('click',function(){
		modalBox.removeClass('opened');
		modalBox.find('.description_wrap').html('');
		jQuery('body').removeClass('modal');
		return false;
	});
}

// -----------------------------------------------------
// -----------------   MY LOAD    ----------------------
// -----------------------------------------------------

function kioto_tm_my_load(){
	
	"use strict";
	
	var speed	= 100;
	setTimeout(function(){kioto_tm_preloader();},speed);
}

// -----------------------------------------------------
// ------------------   CURSOR    ----------------------
// -----------------------------------------------------

function kioto_tm_cursor(){
    "use strict";
	
	var myCursor	= jQuery('.mouse-cursor');
	
	if(myCursor.length){
		if ($("body")) {
        const e = document.querySelector(".cursor-inner"),
            t = document.querySelector(".cursor-outer");
        let n, i = 0,
            o = !1;
        window.onmousemove = function (s) {
            o || (t.style.transform = "translate(" + s.clientX + "px, " + s.clientY + "px)"), e.style.transform = "translate(" + s.clientX + "px, " + s.clientY + "px)", n = s.clientY, i = s.clientX
        }, $("body").on("mouseenter", "a, .toky_tm_topbar .trigger, .cursor-pointer", function () {
            e.classList.add("cursor-hover"), t.classList.add("cursor-hover")
        }), $("body").on("mouseleave", "a, .toky_tm_topbar .trigger, .cursor-pointer", function () {
            $(this).is("a") && $(this).closest(".cursor-pointer").length || (e.classList.remove("cursor-hover"), t.classList.remove("cursor-hover"))
        }), e.style.visibility = "visible", t.style.visibility = "visible"
    }
	}
};

// -----------------------------------------------------
// ---------------    IMAGE TO SVG    ------------------
// -----------------------------------------------------

function kioto_tm_imgtosvg(){
	
	"use strict";
	
	jQuery('img.svg').each(function(){
		
		var jQueryimg 		= jQuery(this);
		var imgClass		= jQueryimg.attr('class');
		var imgURL			= jQueryimg.attr('src');

		jQuery.get(imgURL, function(data) {
			// Get the SVG tag, ignore the rest
			var jQuerysvg = jQuery(data).find('svg');

			// Add replaced image's classes to the new SVG
			if(typeof imgClass !== 'undefined') {
				jQuerysvg = jQuerysvg.attr('class', imgClass+' replaced-svg');
			}

			// Remove any invalid XML tags as per http://validator.w3.org
			jQuerysvg = jQuerysvg.removeAttr('xmlns:a');

			// Replace image with new SVG
			jQueryimg.replaceWith(jQuerysvg);

		}, 'xml');

	});
}

// -----------------------------------------------------
// --------------------   POPUP    ---------------------
// -----------------------------------------------------

function kioto_tm_popup(){
	
	"use strict";

	jQuery('.gallery_zoom').each(function() { // the containers for all your galleries
		jQuery(this).magnificPopup({
			delegate: 'a.zoom', // the selector for gallery item
			type: 'image',
			gallery: {
			  enabled:true
			},
			removalDelay: 300,
			mainClass: 'mfp-fade'
		});

	});
	jQuery('.popup-youtube, .popup-vimeo').each(function() { // the containers for all your galleries
		jQuery(this).magnificPopup({
			disableOn: 700,
			type: 'iframe',
			mainClass: 'mfp-fade',
			removalDelay: 160,
			preloader: false,
			fixedContentPos: false
		});
	});
	
	jQuery('.soundcloude_link').magnificPopup({
	  type : 'image',
	   gallery: {
		   enabled: true, 
	   },
	});
}

// -----------------------------------------------------
// ---------------   DATA IMAGES    --------------------
// -----------------------------------------------------

function kioto_tm_data_images(){
	
	"use strict";
	
	var data			= jQuery('*[data-img-url]');
	
	data.each(function(){
		var element			= jQuery(this);
		var url				= element.data('img-url');
		element.css({backgroundImage: 'url('+url+')'});
	});
}

// -----------------------------------------------------
// ----------------    CONTACT FORM    -----------------
// -----------------------------------------------------

function kioto_tm_contact_form(){
	
	"use strict";
	
	jQuery(".contact_form #send_message").on('click', function(){
		
		var name 		= jQuery(".contact_form #name").val();
		var email 		= jQuery(".contact_form #email").val();
		var message 	= jQuery(".contact_form #message").val();
		var subject 	= jQuery(".contact_form #subject").val();
		var success     = jQuery(".contact_form .returnmessage").data('success');
	
		jQuery(".contact_form .returnmessage").empty(); //To empty previous error/success message.
		//checking for blank fields	
		if(name===''||email===''||message===''){
			
			jQuery('div.empty_notice').slideDown(500).delay(2000).slideUp(500);
		}
		else{
			// Returns successful data submission message when the entered information is stored in database.
			jQuery.post("modal/contact.php",{ ajax_name: name, ajax_email: email, ajax_message:message, ajax_subject: subject}, function(data) {
				
				jQuery(".contact_form .returnmessage").append(data);//Append returned message to message paragraph
				
				
				if(jQuery(".contact_form .returnmessage span.contact_error").length){
					jQuery(".contact_form .returnmessage").slideDown(500).delay(2000).slideUp(500);		
				}else{
					jQuery(".contact_form .returnmessage").append("<span class='contact_success'>"+ success +"</span>");
					jQuery(".contact_form .returnmessage").slideDown(500).delay(4000).slideUp(500);
				}
				
				if(data===""){
					jQuery("#contact_form")[0].reset();//To reset form fields on success
				}
				
			});
		}
		return false; 
	});
}

function kioto_tm_progress_line(){
	
	"use strict";
	
	var line			= jQuery('.progressbar .line');
	var documentHeight 	= jQuery(document).height();
	var windowHeight 	= jQuery(window).height();
	var winScroll 		= jQuery(window).scrollTop();
	var value 			= (winScroll/(documentHeight-windowHeight))*100;
	var position 		= value;

	line.css('height',position+"%");
}

/****************************/ 
/********** TOTOP ***********/ 
/****************************/ 

function kioto_tm_totop(){
  
  "use strict";
  
	jQuery(".progressbar a").on('click', function(e) {
		e.preventDefault();    
		jQuery("html, body").animate({ scrollTop: 0 }, 'slow');
		return false;
	});
}

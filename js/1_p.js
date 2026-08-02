function slideSwitch() {
    var $active = $('#slideshow IMG.active');

    if ( $active.length == 0 ) $active = $('#slideshow IMG:last');

    var $next =  $active.next().length ? $active.next()  : $('#slideshow IMG:first');

    $active.addClass('last-active');

    $next.css({opacity: 0.0})
        .addClass('active')
        .animate({opacity: 1.0}, 1000, function() {
            $active.removeClass('active last-active');
        });
}





$(document).ready(function(){
    setInterval( "slideSwitch()", 5000 );


    $('#slideshowShadow').hover(function() {

        $(this).animate({
            opacity: 0.5

        }, 100, function() {
            // Animation complete.
        });


    }
            ,

            function() {

                $(this).animate({
                    opacity: 0

                }, 100, function() {
                    // Animation complete.
                });


            }




             )



});
// Mobile menu functionality
function showMenu() {
    document.getElementById("navLinks").style.right = "0";
    // Add event listener to close menu when clicking outside
    document.addEventListener('click', closeMenuOnClickOutside);
}

function hideMenu() {
    document.getElementById("navLinks").style.right = "-200px";
    // Remove event listener when menu is closed
    document.removeEventListener('click', closeMenuOnClickOutside);
}

// Function to close menu when clicking outside
function closeMenuOnClickOutside(e) {
    const navLinks = document.getElementById("navLinks");
    const menuIcon = document.querySelector('.fa-bars'); // Assuming you're using Font Awesome
    
    // Check if click is outside the menu and not on the menu icon
    if (!navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
        hideMenu();
    }
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            hideMenu();
        }
    });
});

// Form submission
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    this.reset();
});

// Additional: Close menu when window is resized to desktop size
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        hideMenu();
    }
});

// Counter Animation
document.addEventListener('DOMContentLoaded', function() {
    // Counter animation function
    function animateCounter(counterElement, target) {
        let current = 0;
        const increment = target / 100;
        const duration = 2000; // 2 seconds
        const stepTime = Math.abs(Math.floor(duration / (target / increment)));
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counterElement.textContent = target + '+';
                clearInterval(timer);
                // Add animation class when counter completes
                counterElement.classList.add('animated');
                // Remove animation class after animation completes
                setTimeout(() => {
                    counterElement.classList.remove('animated');
                }, 500);
            } else {
                counterElement.textContent = Math.floor(current) + '+';
            }
        }, stepTime);
    }

    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Initialize counters when they come into view
    let countersAnimated = false;
    
    function checkCounters() {
        const counters = document.querySelectorAll('.counter');
        const firstCounter = counters[0];
        
        if (!countersAnimated && isInViewport(firstCounter)) {
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
            });
            countersAnimated = true;
            // Remove scroll event listener after animation starts
            window.removeEventListener('scroll', checkCounters);
        }
    }

    // Check counters on page load and scroll
    window.addEventListener('load', checkCounters);
    window.addEventListener('scroll', checkCounters);
    
    // Also trigger on resize in case layout changes
    window.addEventListener('resize', checkCounters);
});

// Gallery Functionality
document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.img-item');
    const navItems = document.querySelectorAll('.gallery-nav li');
    const prevButton = document.querySelector('.gallery-controls-previous');
    const nextButton = document.querySelector('.gallery-controls-next');
    let currentIndex = 3; // Center item is active by default
    
    // Function to update gallery based on current index
    function updateGallery() {
        items.forEach((item, index) => {
            const itemIndex = parseInt(item.getAttribute('data-index'));
            
            // Reset all items to default state
            item.style.transform = '';
            item.style.opacity = '0.6';
            item.style.zIndex = '1';
            
            // Get current dimensions based on screen size
            const container = document.querySelector('.gallery-container');
            const containerHeight = container.offsetHeight;
            
            // Calculate proportional sizes
            const smallWidth = Math.min(250, containerHeight * 1.56); // 10:7 aspect ratio
            const smallHeight = smallWidth * 0.7;
            
            const mediumWidth = Math.min(280, containerHeight * 1.6);
            const mediumHeight = mediumWidth * 0.7;
            
            const largeWidth = Math.min(330, containerHeight * 1.5);
            const largeHeight = largeWidth * 0.67;
            
            // Position items based on their relation to current index
            if (itemIndex === currentIndex) {
                // Center item
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
                item.style.zIndex = '3';
                item.style.width = largeWidth + 'px';
                item.style.height = largeHeight + 'px';
            } else if (itemIndex === currentIndex - 1) {
                // Left adjacent
                item.style.transform = 'translateX(-60%) scale(0.9)';
                item.style.opacity = '0.8';
                item.style.zIndex = '2';
                item.style.width = mediumWidth + 'px';
                item.style.height = mediumHeight + 'px';
            } else if (itemIndex === currentIndex + 1) {
                // Right adjacent
                item.style.transform = 'translateX(60%) scale(0.9)';
                item.style.opacity = '0.8';
                item.style.zIndex = '2';
                item.style.width = mediumWidth + 'px';
                item.style.height = mediumHeight + 'px';
            } else if (itemIndex === currentIndex - 2) {
                // Far left
                item.style.transform = 'translateX(-120%) scale(0.8)';
                item.style.width = smallWidth + 'px';
                item.style.height = smallHeight + 'px';
            } else if (itemIndex === currentIndex + 2) {
                // Far right
                item.style.transform = 'translateX(120%) scale(0.8)';
                item.style.width = smallWidth + 'px';
                item.style.height = smallHeight + 'px';
            } else {
                // Hide items that are too far
                item.style.opacity = '0';
            }
        });
        
        // Update navigation indicators
        navItems.forEach((navItem, index) => {
            if (index + 1 === currentIndex) {
                navItem.classList.add('active');
            } else {
                navItem.classList.remove('active');
            }
        });
    }
    
    // Next button functionality
    nextButton.addEventListener('click', function() {
        if (currentIndex < items.length) {
            currentIndex++;
            updateGallery();
        }
    });
    
    // Previous button functionality
    prevButton.addEventListener('click', function() {
        if (currentIndex > 1) {
            currentIndex--;
            updateGallery();
        }
    });
    
    // Navigation dots functionality
    navItems.forEach(navItem => {
        navItem.addEventListener('click', function() {
            currentIndex = parseInt(this.getAttribute('data-index'));
            updateGallery();
        });
    });
    
    // Update gallery on window resize
    window.addEventListener('resize', updateGallery);
    
    // Initialize gallery
    updateGallery();
    
    // Auto-rotate gallery (optional)
    setInterval(() => {
        if (currentIndex < items.length) {
            currentIndex++;
        } else {
            currentIndex = 1;
        }
        updateGallery();
    }, 5000);
});

//carousel functionality//

var copy = document.querySelector(".logos-slide").cloneNode(true);
document.querySelector(".logos").appendChild(copy);

// Add click functionality for mobile devices
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function() {
                // For mobile devices, toggle the flip on click
                if (window.innerWidth <= 768) {
                    this.querySelector('.card-inner').classList.toggle('flipped');
                }
            });
        });

        // Add keyboard accessibility
        document.querySelectorAll('.service-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.querySelector('.card-inner').classList.toggle('flipped');
                }
            });
        });
         // Gallery navigation functionality
        document.addEventListener('DOMContentLoaded', function() {
            const prevBtn = document.querySelector('.prev-btn');
            const nextBtn = document.querySelector('.next-btn');
            const navItems = document.querySelectorAll('.gallery-nav li');
            const imgItems = document.querySelectorAll('.img-item');
            
            let currentIndex = 2; // Center image index
            
            function updateGallery() {
                // Reset all images
                imgItems.forEach((item, index) => {
                    item.style.transform = '';
                    item.style.opacity = '';
                    item.style.zIndex = '';
                    item.style.boxShadow = '';
                });
                
                // Update positions based on current index
                imgItems.forEach((item, index) => {
                    const diff = index - currentIndex;
                    
                    if (diff === 0) {
                        // Center image
                        item.style.transform = 'translateX(0) scale(1)';
                        item.style.opacity = '1';
                        item.style.zIndex = '3';
                        item.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
                    } else if (diff === -1 || diff === 1) {
                        // Adjacent images
                        const translateX = diff * 60;
                        item.style.transform = `translateX(${translateX}%) scale(0.9)`;
                        item.style.opacity = '0.8';
                        item.style.zIndex = '2';
                    } else if (diff === -2 || diff === 2) {
                        // Outer images
                        const translateX = diff * 60;
                        item.style.transform = `translateX(${translateX}%) scale(0.8)`;
                        item.style.opacity = '0.6';
                        item.style.zIndex = '1';
                    }
                });
                
                // Update navigation dots
                navItems.forEach((item, index) => {
                    item.classList.toggle('active', index === currentIndex);
                });
            }
            
            prevBtn.addEventListener('click', function() {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateGallery();
                }
            });
            
            nextBtn.addEventListener('click', function() {
                if (currentIndex < imgItems.length - 1) {
                    currentIndex++;
                    updateGallery();
                }
            });
            
            // Initialize gallery
            updateGallery();
            
            // Full-screen image functionality
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('enlargedImg');
            const closeBtn = document.querySelector('.close');
            const prevFullBtn = document.querySelector('.prev-full');
            const nextFullBtn = document.querySelector('.next-full');
            const currentImgSpan = document.getElementById('currentImg');
            const totalImgsSpan = document.getElementById('totalImgs');
            
            // Set total images count
            totalImgsSpan.textContent = imgItems.length;
            
            // Add click event to each image
            imgItems.forEach((item, index) => {
                item.addEventListener('click', function() {
                    modal.style.display = 'block';
                    modalImg.src = this.style.backgroundImage.slice(5, -2);
                    currentIndex = index;
                    currentImgSpan.textContent = index + 1;
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                });
            });
            
            // Navigation in full-screen mode
            prevFullBtn.addEventListener('click', function() {
                if (currentIndex > 0) {
                    currentIndex--;
                    modalImg.src = imgItems[currentIndex].style.backgroundImage.slice(5, -2);
                    currentImgSpan.textContent = currentIndex + 1;
                }
            });
            
            nextFullBtn.addEventListener('click', function() {
                if (currentIndex < imgItems.length - 1) {
                    currentIndex++;
                    modalImg.src = imgItems[currentIndex].style.backgroundImage.slice(5, -2);
                    currentImgSpan.textContent = currentIndex + 1;
                }
            });
            
            // Close modal when clicking X
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scrolling
            });
            
            // Close modal when clicking outside the image
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Restore scrolling
                }
            });
            
            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Restore scrolling
                }
                
                // Navigate with arrow keys
                if (modal.style.display === 'block') {
                    if (e.key === 'ArrowLeft' && currentIndex > 0) {
                        currentIndex--;
                        modalImg.src = imgItems[currentIndex].style.backgroundImage.slice(5, -2);
                        currentImgSpan.textContent = currentIndex + 1;
                    } else if (e.key === 'ArrowRight' && currentIndex < imgItems.length - 1) {
                        currentIndex++;
                        modalImg.src = imgItems[currentIndex].style.backgroundImage.slice(5, -2);
                        currentImgSpan.textContent = currentIndex + 1;
                    }
                }
            });
        });
        // Simple form validation
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.querySelector('input[name="name"]').value;
            const email = document.querySelector('input[name="email"]').value;
            const message = document.querySelector('textarea[name="message"]').value;
            
            if (name && email && message) {
                alert('Thank you for your message! We will get back to you soon.');
                this.reset();
            } else {
                alert('Please fill in all fields.');
            }
        });
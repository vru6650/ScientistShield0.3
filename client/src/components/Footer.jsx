import { Footer, Tooltip, TextInput, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { footerLinks, socialMediaLinks } from '../data/footerData'; // Adjust path if needed
import FooterWave from './FooterWave';

// --- A component for the interactive aurora background ---
const AuroraBackground = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 100, stiffness: 150 };
    const smoothMouseX = useSpring(mouseX, springConfig);
    const smoothMouseY = useSpring(mouseY, springConfig);

    const handleMouseMove = (e) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();

        // Calculate position relative to the center of the target element
        const xCenter = left + width / 2;
        const yCenter = top + height / 2;

        // Map mouse position to a smaller, more controlled range for subtle movement
        const moveRange = 100; // Max pixels the blur will move from center
        const mappedX = ((clientX - xCenter) / width) * moveRange;
        const mappedY = ((clientY - yCenter) / height) * moveRange;

        mouseX.set(mappedX);
        mouseY.set(mappedY);
    };

    return (
        <div
            className="absolute inset-0 overflow-hidden rounded-t-lg pointer-events-none" // Ensure it doesn't block clicks
            onMouseMove={handleMouseMove} // Still track mouse for effect
        >
            <motion.div
                className="absolute w-96 h-96 bg-professional-blue-500/20 rounded-full blur-3xl opacity-70" // Increased blur, added opacity
                style={{
                    x: useTransform(smoothMouseX, val => val - 192),
                    y: useTransform(smoothMouseY, val => val - 192)
                }}
            />
            <motion.div
                className="absolute w-96 h-96 bg-accent-teal/20 rounded-full blur-3xl opacity-70" // Increased blur, added opacity
                style={{
                    x: useTransform(smoothMouseX, val => val - 192 + 200),
                    y: useTransform(smoothMouseY, val => val - 192 + 100)
                }}
            />
            <motion.div // Added a third, more subtle blob
                className="absolute w-80 h-80 bg-professional-blue-300/15 rounded-full blur-3xl opacity-60"
                style={{
                    x: useTransform(smoothMouseX, val => val - 192 - 150),
                    y: useTransform(smoothMouseY, val => val - 192 - 50)
                }}
            />
        </div>
    );
};


export default function FooterCom() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');

    // --- Debounced Scroll Visibility Toggle ---
    useEffect(() => {
        let timeout;
        const handleScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (window.scrollY > 300) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            }, 100); // Debounce scroll event
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeout);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubscribe = async (e) => { // Made async to simulate API call
        e.preventDefault();
        if (!email) {
            alert('Please enter your email.');
            return;
        }

        try {
            // Simulate API call
            console.log(`Subscribing with email: ${email}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

            alert('Thank you for subscribing! Check your inbox for confirmation.');
            setEmail('');
        } catch (error) {
            console.error('Subscription failed:', error);
            alert('Subscription failed. Please try again.');
        }
    };

    return (
        <footer className="relative mt-20">
            <FooterWave />
            <div className='relative z-10 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl border-t border-gray-300 dark:border-gray-700 overflow-hidden'> {/* Increased blur, added overflow-hidden */}
                <AuroraBackground />

                <div className='w-full max-w-7xl mx-auto py-12 px-6 relative z-20'> {/* Increased padding, added z-20 */}
                    <div className='grid w-full justify-between sm:flex md:grid-cols-1'>
                        <div className='mb-8 sm:mb-0'> {/* Increased bottom margin for logo section */}
                            <Link to='/' className='self-center whitespace-nowrap text-2xl sm:text-3xl font-extrabold dark:text-white'> {/* Larger, bolder logo */}
                                <span className='px-3 py-1 bg-professional-gradient rounded-lg text-white shadow-lg transition-transform duration-300 hover:scale-105'> {/* Stronger gradient, shadow, hover */}
                                    Sahand's
                                </span>
                                <span className="ml-2">Blog</span> {/* Added margin to "Blog" */}
                            </Link>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-sm text-sm">
                                Explore insightful articles and tutorials on web development, programming, and more. Join our community!
                            </p>
                        </div>
                        <div className='grid grid-cols-2 gap-10 mt-4 sm:grid-cols-4 sm:gap-8'> {/* Increased gaps */}
                            {footerLinks.map((section) => (
                                <div key={section.title}>
                                    <Footer.Title title={section.title} className="text-lg font-bold text-gray-800 dark:text-white mb-3" /> {/* Larger, bolder titles */}
                                    <Footer.LinkGroup col className="gap-2"> {/* More space between links */}
                                        {section.links.map((link) => (
                                            <Footer.Link
                                                key={link.name}
                                                href={link.href}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className="text-gray-600 dark:text-gray-400 hover:text-accent-teal dark:hover:text-accent-teal transition-colors duration-200" // Enhanced link styles
                                            >
                                                {link.name}
                                            </Footer.Link>
                                        ))}
                                    </Footer.LinkGroup>
                                </div>
                            ))}
                            <div>
                                <Footer.Title title='Stay Updated' className="text-lg font-bold text-gray-800 dark:text-white mb-3" />
                                <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
                                    <TextInput
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="rounded-md focus:ring-accent-teal focus:border-accent-teal" // Styled input
                                    />
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            type="submit"
                                            gradientDuoTone="purpleToPink"
                                            className="w-full"
                                        >
                                            Subscribe
                                        </Button>
                                    </motion.div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <Footer.Divider className="my-10 border-gray-300 dark:border-gray-700" /> {/* More space for divider */}
                    <div className='w-full sm:flex sm:items-center sm:justify-between'>
                        <Footer.Copyright href='#' by="Sahand's blog" year={new Date().getFullYear()} className="text-gray-600 dark:text-gray-400" />
                        <div className='flex gap-7 sm:mt-0 mt-6 sm:justify-center'> {/* Increased gap, top margin */}
                            {socialMediaLinks.map((social) => (
                                <Tooltip content={social.name} key={social.name} placement="top"> {/* Tooltip on top */}
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.2, color: '#35B8A8' }} // More pronounced hover, add color
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                        className="text-gray-500 dark:text-gray-400" // Base color for icons
                                    >
                                        <Footer.Icon
                                            href={social.href}
                                            icon={social.icon}
                                            aria-label={`Link to our ${social.name} page`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                        />
                                    </motion.div>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.button
                        onClick={scrollToTop}
                        className='fixed bottom-5 right-5 z-50 h-14 w-14 bg-accent-teal text-white rounded-full shadow-xl hover:bg-professional-blue-700 focus:outline-none focus:ring-4 focus:ring-professional-blue-400 focus:ring-offset-2 flex items-center justify-center' // Larger, bolder button with shadow
                        aria-label='Go to top of page'
                        initial={{ opacity: 0, scale: 0.7, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7, y: 20 }}
                        transition={{ ease: "backOut", duration: 0.3 }} // Bouncier entrance/exit
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </footer>
    );
}
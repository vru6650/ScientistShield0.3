/** @jest-environment jsdom */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackToTopButton from '../BackToTopButton.jsx';

describe('BackToTopButton', () => {
    beforeEach(() => {
        window.scrollTo = jest.fn();
        Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    });

    test('is hidden initially', () => {
        const { getByRole } = render(<BackToTopButton />);
        const button = getByRole('button', { name: /scroll to top/i });
        expect(button).toHaveClass('opacity-0');
    });

    test('becomes visible after scrolling and scrolls to top when clicked', () => {
        const { getByRole } = render(<BackToTopButton />);
        Object.defineProperty(window, 'scrollY', { writable: true, value: 400 });
        fireEvent.scroll(window);
        const button = getByRole('button', { name: /scroll to top/i });
        expect(button).toHaveClass('opacity-100');
        fireEvent.click(button);
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
});
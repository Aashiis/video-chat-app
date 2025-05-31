// components/ThreeDotMenu.tsx
// Ensure you have Tailwind CSS configured in your Next.js project.

import React, { useState, useEffect, useRef } from 'react';
// Using react-icons
import { BsThreeDotsVertical } from 'react-icons/bs';
import { CgProfile, CgUserAdd } from 'react-icons/cg';

// Define the props for the component (empty for now, but good practice)
interface ThreeDotMenuProps {
    onAddUserClick: () => void; // Callback for "Add User" action
}

// Define the structure for a menu item
interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode; // Icons are React components
    action: () => void;
    isDestructive?: boolean;
}

const ThreeDotMenu: React.FC<ThreeDotMenuProps> = ({onAddUserClick}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Toggle menu visibility
    const toggleMenu = (): void => {
        setIsOpen(!isOpen);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Ensure event.target is a Node before calling contains
            if (!(event.target instanceof Node)) {
                return;
            }
            // Close if clicked outside the menu and not on the button itself
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Cleanup the event listener on component unmount
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

    // Close menu with Escape key
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            // Cleanup the event listener on component unmount
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

    // Menu items - can be customized or passed as props
    const menuItems: MenuItem[] = [
        { id: 'add-user', label: 'Add User', icon: <CgUserAdd size={16} className="mr-2" />, action: () => onAddUserClick() },
        { id: 'profile', label: 'Profile', icon: <CgProfile size={16} className="mr-2" />, action: () => console.log('Profile clicked') },
        // { id: 'archive', label: 'Archive', icon: <FiArchive size={16} className="mr-2" />, action: () => console.log('Archive clicked') },
        // { id: 'delete', label: 'Delete', icon: <FiTrash2 size={16} className="mr-2 text-red-500" />, action: () => console.log('Delete clicked'), isDestructive: true },
    ];

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            {/* 3-Dot Menu Button */}
            <button
                ref={buttonRef}
                id="menuButton"
                type="button"
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={toggleMenu}
            >
                <span className="sr-only">Open options</span>
                <BsThreeDotsVertical size={20} className="text-gray-600 dark:text-gray-300" />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    id="dropdownMenu"
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menuButton"
                    tabIndex={-1} // Make it focusable
                >
                    <div className="py-1" role="none">
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {item.id === 'delete' && <div className="border-t border-gray-200 dark:border-gray-700 mx-1 my-1"></div>}
                                <a
                                    href="#" // Using href="#" for link-like behavior, preventDefault below
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                        e.preventDefault();
                                        item.action();
                                        setIsOpen(false); // Close menu after action
                                    }}
                                    className={`flex items-center px-4 py-2 text-sm rounded-md m-1
                                        ${item.isDestructive
                                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-red-200' // Adjusted dark hover for destructive
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-50'
                                        }`}
                                    role="menuitem"
                                    tabIndex={-1}
                                    id={`menu-item-${index}`}
                                >
                                    {item.icon}
                                    {item.label}
                                </a>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThreeDotMenu;

// Example usage in a Next.js page (e.g., pages/index.tsx):
/*
import ThreeDotMenu from '../components/ThreeDotMenu'; // Adjust path as needed

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100 dark:bg-gray-900">
            <h1 className="text-2xl font-semibold mb-4 dark:text-white">My App</h1>
            <p className="mb-8 dark:text-gray-300">Here is the 3-dot menu in action:</p>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                 <ThreeDotMenu />
            </div>

            <div className="mt-10 p-4 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                    This is some other content on the page to test click-outside functionality.
                </p>
            </div>
        </div>
    );
}
*/
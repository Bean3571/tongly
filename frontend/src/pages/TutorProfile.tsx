import React from 'react';

export const TutorProfile = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Tutor Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row items-center md:items-start">
                    <img
                        src="https://via.placeholder.com/200"
                        alt="Tutor"
                        className="w-48 h-48 rounded-full mb-4 md:mb-0 md:mr-8"
                    />
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Sarah Johnson
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                            English & Spanish Tutor
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                Native English
                            </span>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                Fluent Spanish
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            ⭐ 4.9 (124 reviews) • 🎓 TEFL Certified • 📚 3 years experience
                        </p>
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Book a Lesson
                        </button>
                    </div>
                </div>
            </div>

            {/* About & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* About Section */}
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            About Me
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Hello! I'm a passionate language teacher with over 3 years of experience.
                            I specialize in conversational English and Spanish, focusing on practical,
                            real-world communication skills.
                        </p>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Teaching Style
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            My lessons are interactive and tailored to each student's needs.
                            I use a combination of conversation practice, grammar exercises,
                            and cultural discussions.
                        </p>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Reviews
                        </h2>
                        {/* Placeholder Reviews */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border-b dark:border-gray-700 last:border-0 py-4">
                                <div className="flex items-center mb-2">
                                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                                        Student {i}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Great teacher! Very patient and knowledgeable.
                                    The lessons are well-structured and fun.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Availability & Booking */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-fit">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Availability
                    </h2>
                    <div className="mb-4">
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Hourly Rate:
                            <span className="text-blue-600 dark:text-blue-400 font-semibold ml-2">
                                $25/hour
                            </span>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-gray-600 dark:text-gray-300">
                            Monday: 9:00 AM - 5:00 PM
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Wednesday: 9:00 AM - 5:00 PM
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Friday: 9:00 AM - 5:00 PM
                        </p>
                    </div>
                    <button className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Check Available Times
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorProfile; 
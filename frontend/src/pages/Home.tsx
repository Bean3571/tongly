import { useTranslation } from '../contexts/I18nContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
            <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Языкус ✨</span>
                    <span className="block text-orange-500">{t('home.subtitle')}</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    {t('home.description')}
                </p>
                {!user && (
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div className="rounded-md shadow">
                            <Link
                                to="/register"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 md:py-4 md:text-lg md:px-10"
                            >
                                {t('auth.register')}
                            </Link>
                        </div>
                        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-500 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                                {t('auth.login')}
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-orange-500 text-3xl mb-3">📚</div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {t('home.features.learn_title')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-600">
                                <p>{t('home.features.learn_description')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-orange-500 text-3xl mb-3">👥</div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {t('home.features.connect_title')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-600">
                                <p>{t('home.features.connect_description')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-orange-500 text-3xl mb-3">🚀</div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {t('home.features.grow_title')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-600">
                                <p>{t('home.features.grow_description')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 
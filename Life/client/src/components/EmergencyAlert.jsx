// src/components/EmergencyAlert.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const EmergencyAlert = () => {
    const [bloodType, setBloodType] = useState('');
    const [location, setLocation] = useState('');
    const [urgency, setUrgency] = useState('medium');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in to send emergency alerts');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/emergency', {
                patientId: user._id,
                bloodType,
                location,
                urgency,
                message
            });
            
            setMessage('Emergency alert sent successfully!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error sending alert:', error);
            setMessage('Failed to send emergency alert. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Send Emergency Blood Request
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Fill in the details to send an emergency alert to potential donors.
                    </p>
                </div>
                
                {message && (
                    <div className={`p-4 ${message.includes('successfully') ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-sm ${message.includes('successfully') ? 'text-green-700' : 'text-red-700'}`}>
                            {message}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
                                Blood Type Required
                            </label>
                            <select
                                id="bloodType"
                                name="bloodType"
                                required
                                value={bloodType}
                                onChange={(e) => setBloodType(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="">Select blood type</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                Hospital/Location
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="location"
                                    id="location"
                                    required
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Enter hospital name and address"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                                Urgency Level
                            </label>
                            <select
                                id="urgency"
                                name="urgency"
                                required
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="low">Low (24+ hours)</option>
                                <option value="medium">Medium (12-24 hours)</option>
                                <option value="high">High (4-12 hours)</option>
                                <option value="critical">Critical (Less than 4 hours)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                                Additional Information
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                                    placeholder="Any additional information for the donors..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                {isLoading ? 'Sending...' : 'Send Emergency Alert'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmergencyAlert;
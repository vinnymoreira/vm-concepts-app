import React from 'react';
import { Mail, Phone, Briefcase, Globe, LinkIcon, User, Key, Plus, X } from 'lucide-react';
import ToggleSwitch from '../../components/ToggleSwitch';

function EditClientForm({ client, handleInputChange, handleStatusChange }) {
    const renderField = (icon, value, type = "text", fieldName = '') => (
        <div className="flex items-center mb-4">
            <div className="flex-shrink-0 mr-3">
                {icon}
            </div>
            <div className="flex-grow">
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => handleInputChange(e, fieldName)}
                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none py-1 transition duration-150 ease-in-out"
                />
            </div>
        </div>
    );

    const handleJsonFieldChange = (fieldName, subField, value) => {
        const currentData = client[fieldName] || {};
        const updatedData = { ...currentData, [subField]: value };
        handleInputChange({ target: { value: updatedData } }, fieldName);
    };

    const renderJsonCredentials = (title, fieldName, data = {}) => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                    <input
                        type="text"
                        value={data.url || ''}
                        onChange={(e) => handleJsonFieldChange(fieldName, 'url', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2"
                        placeholder="Enter URL"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                    <input
                        type="text"
                        value={data.username || ''}
                        onChange={(e) => handleJsonFieldChange(fieldName, 'username', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2"
                        placeholder="Enter username"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        type="password"
                        value={data.password || ''}
                        onChange={(e) => handleJsonFieldChange(fieldName, 'password', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2"
                        placeholder="Enter password"
                    />
                </div>
            </div>
        </div>
    );

    const handleAddAdditionalInfo = () => {
        const currentInfo = Array.isArray(client.additional_info) ? client.additional_info : [];
        handleInputChange(
            { target: { value: [...currentInfo, { key: '', value: '' }] } },
            'additional_info'
        );
    };

    const handleRemoveAdditionalInfo = (index) => {
        const currentInfo = Array.isArray(client.additional_info) ? client.additional_info : [];
        handleInputChange(
            { target: { value: currentInfo.filter((_, i) => i !== index) } },
            'additional_info'
        );
    };

    const handleAdditionalInfoChange = (index, field, value) => {
        const currentInfo = Array.isArray(client.additional_info) ? [...client.additional_info] : [];
        currentInfo[index] = { ...currentInfo[index], [field]: value };
        handleInputChange({ target: { value: currentInfo } }, 'additional_info');
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div className="flex-grow">
                    <input
                        type="text"
                        value={client.name || ''}
                        onChange={(e) => handleInputChange(e, 'name')}
                        className="text-3xl font-bold w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                    />
                </div>
                <div className="flex items-center ml-4">
                    <ToggleSwitch
                        isOn={client.status === 'active'}
                        handleToggle={() => handleStatusChange(client.status !== 'active')}
                        onColor="bg-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                        {client.status === "active" ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {renderField(<Mail className="w-6 h-6 text-indigo-500" />, client.email, "email", "email")}
                {renderField(<Phone className="w-6 h-6 text-indigo-500" />, client.phone, "tel", "phone")}
                {renderField(<Briefcase className="w-6 h-6 text-indigo-500" />, client.company, "text", "company")}
                {renderField(<Globe className="w-6 h-6 text-indigo-500" />, client.website, "url", "website")}
            </div>

            {/* GitHub Repository */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-2">GitHub Repository</h3>
                {renderField(<LinkIcon className="w-6 h-6 text-gray-400" />, client.github_repo, "text", "github_repo")}
            </div>

            {/* Credentials Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {renderJsonCredentials("Web Host", "web_host", client.web_host)}
                {renderJsonCredentials("Domain Registrar", "registrar", client.registrar)}
            </div>

            {/* Additional Info Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Additional Info</h2>
                    <button
                        type="button"
                        onClick={handleAddAdditionalInfo}
                        className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Field
                    </button>
                </div>
                <div className="space-y-4">
                    {Array.isArray(client.additional_info) && client.additional_info.map((info, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-grow grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={info.key || ''}
                                    onChange={(e) => handleAdditionalInfoChange(index, 'key', e.target.value)}
                                    placeholder="Field name"
                                    className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2"
                                />
                                <input
                                    type="text"
                                    value={info.value || ''}
                                    onChange={(e) => handleAdditionalInfoChange(index, 'value', e.target.value)}
                                    placeholder="Value"
                                    className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveAdditionalInfo(index)}
                                className="text-red-500 hover:text-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EditClientForm;
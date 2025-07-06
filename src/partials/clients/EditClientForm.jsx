import React from 'react';
import { Mail, Phone, Briefcase, Globe, LinkIcon, User, Key, Plus, X } from 'lucide-react';
import ToggleSwitch from '../../components/ToggleSwitch';
import LogoUploader from '../../components/LogoUploader';

function EditClientForm({ client, handleInputChange, handleStatusChange }) {
    const renderField = (icon, value, type = "text", fieldName = '', placeholder = '') => (
        <div className="space-y-2">
            <input
                type={type}
                value={value || ''}
                onChange={(e) => handleInputChange(e, fieldName)}
                placeholder={placeholder}
                className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
        </div>
    );

    const handleJsonFieldChange = (fieldName, subField, value) => {
        const currentData = client[fieldName] || {};
        const updatedData = { ...currentData, [subField]: value };
        handleInputChange({ target: { value: updatedData } }, fieldName);
    };

    const renderJsonCredentials = (title, fieldName, data = {}) => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">URL</label>
                    <input
                        type="text"
                        value={data.url || ''}
                        onChange={(e) => handleJsonFieldChange(fieldName, 'url', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Enter URL"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Username</label>
                    <input
                        type="text"
                        value={data.username || ''}
                        onChange={(e) => handleJsonFieldChange(fieldName, 'username', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Enter username"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        type="password"
                        value={data.password || ''}
                        onChange={(e) => handleJsonFieldChange(fieldName, 'password', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
        <div className="space-y-8">
            {/* Client Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <div className="flex items-center gap-4 flex-grow">
                    <LogoUploader
                        currentImageUrl={client.logo_url}
                        companyName={client.company || 'C'}
                        size="w-16 h-16"
                        isEditable={true}
                        onImageUpload={(url) => handleInputChange({ target: { value: url } }, 'logo_url')}
                        onImageRemove={() => handleInputChange({ target: { value: null } }, 'logo_url')}
                    />
                    <div className="flex-grow">
                        <input
                            type="text"
                            value={client.company || ''}
                            onChange={(e) => handleInputChange(e, 'company')}
                            placeholder="Company Name"
                            className="text-3xl font-bold w-full bg-transparent border-none focus:outline-none text-indigo-900 dark:text-indigo-100 placeholder-indigo-400 dark:placeholder-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ToggleSwitch
                        isOn={client.status === 'active'}
                        handleToggle={() => handleStatusChange(client.status !== 'active')}
                        onColor="bg-green-500"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        client.status === "active" 
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                        {client.status === "active" ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Basic Information */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-2 text-indigo-500" />
                    Contact Information
                </h2>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="mb-4 space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <User className="w-4 h-4 mr-2 text-indigo-500" />
                            Contact Person Name
                        </label>
                        <input
                            type="text"
                            value={client.name || ''}
                            onChange={(e) => handleInputChange(e, 'name')}
                            placeholder="Enter contact person name"
                            className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-indigo-500" />
                                Email
                            </label>
                            {renderField(null, client.email, "email", "email", "Enter email address")}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-indigo-500" />
                                Phone
                            </label>
                            {renderField(null, client.phone, "tel", "phone", "Enter phone number")}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Globe className="w-4 h-4 mr-2 text-indigo-500" />
                                Website
                            </label>
                            {renderField(null, client.website, "url", "website", "Enter website URL")}
                        </div>
                    </div>
                </div>
            </div>

            {/* GitHub Repository */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <LinkIcon className="w-6 h-6 mr-2 text-indigo-500" />
                    Repository
                </h2>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <LinkIcon className="w-4 h-4 mr-2 text-gray-500" />
                            GitHub Repository URL
                        </label>
                        {renderField(null, client.github_repo, "text", "github_repo", "Enter GitHub repository URL")}
                    </div>
                </div>
            </div>

            {/* Credentials Sections */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <Key className="w-6 h-6 mr-2 text-indigo-500" />
                    Access Credentials
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderJsonCredentials("Web Host", "web_host", client.web_host)}
                    {renderJsonCredentials("Domain Registrar", "registrar", client.registrar)}
                </div>
            </div>

            {/* Additional Info Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <Briefcase className="w-6 h-6 mr-2 text-indigo-500" />
                        Additional Information
                    </h2>
                    <button
                        type="button"
                        onClick={handleAddAdditionalInfo}
                        className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </button>
                </div>
                <div className="space-y-4">
                    {Array.isArray(client.additional_info) && client.additional_info.map((info, index) => (
                        <div key={index} className="flex items-center gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Field Name</label>
                                    <input
                                        type="text"
                                        value={info.key || ''}
                                        onChange={(e) => handleAdditionalInfoChange(index, 'key', e.target.value)}
                                        placeholder="Field name"
                                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Value</label>
                                    <input
                                        type="text"
                                        value={info.value || ''}
                                        onChange={(e) => handleAdditionalInfoChange(index, 'value', e.target.value)}
                                        placeholder="Enter value"
                                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveAdditionalInfo(index)}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all"
                                title="Remove field"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {(!client.additional_info || client.additional_info.length === 0) && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                <Briefcase className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">No additional fields added yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditClientForm;
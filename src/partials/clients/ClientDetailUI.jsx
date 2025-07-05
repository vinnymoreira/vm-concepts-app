import React from 'react';
import { Mail, Phone, Briefcase, Globe, LinkIcon, User, Key, Copy, Check } from 'lucide-react';
import ToggleSwitch from '../../components/ToggleSwitch';

function ClientDetailUI({ client, handleStatusChange, copyToClipboard, copiedField }) {
    const renderField = (icon, value, type = "text", link = null, canCopy = false, fieldName = '') => (
        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
            <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center shadow-sm">
                    {icon}
                </div>
            </div>
            <div className="flex-grow flex items-center justify-between">
                <div>
                    {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors">
                            {value || 'N/A'}
                        </a>
                    ) : (
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {value || 'N/A'}
                        </p>
                    )}
                </div>
                {canCopy && value && (
                    <button
                        onClick={() => copyToClipboard(value, fieldName)}
                        className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                        title="Copy to clipboard"
                    >
                        {copiedField === fieldName ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );

    const renderCredentials = (urlIcon, url, usernameIcon, username, passwordIcon, password, fieldPrefix) => (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
            {renderField(urlIcon, url, "text", url, false, `${fieldPrefix}_url`)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField(usernameIcon, username, "text", null, true, `${fieldPrefix}_username`)}
                {renderField(passwordIcon, password, "password", null, true, `${fieldPrefix}_password`)}
            </div>
        </div>
    );

    const renderAdditionalInfo = () => {
        const additionalInfo = Array.isArray(client.additional_info) ? client.additional_info : [];
        if (additionalInfo.length === 0) {
            return (
                <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No additional information</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalInfo.map((info, index) => (
                    <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{info.key}</div>
                        <div className="text-gray-600 dark:text-gray-300">{info.value}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Client Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <div className="flex-grow">
                    <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">{client.name || 'Unnamed Client'}</h1>
                    <p className="text-indigo-600 dark:text-indigo-300">Contact Person</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(<Mail className="w-5 h-5 text-indigo-500" />, client.email, "email", null, true, "email")}
                    {renderField(<Phone className="w-5 h-5 text-indigo-500" />, client.phone, "tel", `tel:${client.phone}`, false, "phone")}
                    {renderField(<Briefcase className="w-5 h-5 text-indigo-500" />, client.company, "text", null, false, "company")}
                    {renderField(<Globe className="w-5 h-5 text-indigo-500" />, client.website, "url", client.website, false, "website")}
                </div>
            </div>

            {/* Access Credentials */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <Key className="w-6 h-6 mr-2 text-indigo-500" />
                    Access Credentials
                </h2>
                <div className="space-y-6">
                    {/* GitHub Repo */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">GitHub Repository</h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            {renderField(<LinkIcon className="w-5 h-5 text-gray-500" />, client.github_repo, "text", client.github_repo, false, "github_repo")}
                        </div>
                    </div>

                    {/* Web Host & Registrar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Web Host</h3>
                            {renderCredentials(
                                <LinkIcon className="w-5 h-5 text-gray-500" />, client.web_host.url,
                                <User className="w-5 h-5 text-gray-500" />, client.web_host.username,
                                <Key className="w-5 h-5 text-gray-500" />, client.web_host.password,
                                "web_host"
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Domain Registrar</h3>
                            {renderCredentials(
                                <LinkIcon className="w-5 h-5 text-gray-500" />, client.registrar.url,
                                <User className="w-5 h-5 text-gray-500" />, client.registrar.username,
                                <Key className="w-5 h-5 text-gray-500" />, client.registrar.password,
                                "registrar"
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Information */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <Briefcase className="w-6 h-6 mr-2 text-indigo-500" />
                    Additional Information
                </h2>
                {renderAdditionalInfo()}
            </div>
        </div>
    );
}

export default ClientDetailUI;
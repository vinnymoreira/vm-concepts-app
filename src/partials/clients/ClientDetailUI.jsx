import React from 'react';
import { Mail, Phone, Briefcase, Globe, LinkIcon, User, Key, Copy, Check } from 'lucide-react';
import ToggleSwitch from '../../components/ToggleSwitch';

function ClientDetailUI({ client, handleStatusChange, copyToClipboard, copiedField }) {
    const renderField = (icon, value, type = "text", link = null, canCopy = false, fieldName = '') => (
        <div className="flex items-center mb-4">
            <div className="flex-shrink-0 mr-3">
                {icon}
            </div>
            <div className="flex-grow flex items-center">
                {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {value || 'N/A'}
                    </a>
                ) : (
                    <p className="text-gray-900 dark:text-gray-100">
                        {value || 'N/A'}
                    </p>
                )}
                {canCopy && (
                    <button
                        onClick={() => copyToClipboard(value, fieldName)}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                        title="Copy to clipboard"
                    >
                        {copiedField === fieldName ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );

    const renderCredentials = (urlIcon, url, usernameIcon, username, passwordIcon, password, fieldPrefix) => (
        <div className="mb-4">
            {renderField(urlIcon, url, "text", url, false, `${fieldPrefix}_url`)}
            <div className="grid grid-cols-2 gap-4 mt-2">
                {renderField(usernameIcon, username, "text", null, true, `${fieldPrefix}_username`)}
                {renderField(passwordIcon, password, "password", null, true, `${fieldPrefix}_password`)}
            </div>
        </div>
    );

    const renderAdditionalInfo = () => {
        const additionalInfo = Array.isArray(client.additional_info) ? client.additional_info : [];
        if (additionalInfo.length === 0) {
            return <p className="text-gray-500">No additional information</p>;
        }

        return additionalInfo.map((info, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium text-gray-700 dark:text-gray-300">{info.key}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">{info.value}</div>
            </div>
        ));
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div className="flex-grow">
                    <h1 className="text-3xl font-bold">{client.name || 'Unnamed Client'}</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField(<Mail className="w-6 h-6 text-indigo-500" />, client.email, "email", null, true, "email")}
                {renderField(<Phone className="w-6 h-6 text-indigo-500" />, client.phone, "tel", `tel:${client.phone}`, false, "phone")}
                {renderField(<Briefcase className="w-6 h-6 text-indigo-500" />, client.company, "text", null, false, "company")}
                {renderField(<Globe className="w-6 h-6 text-indigo-500" />, client.website, "url", client.website, false, "website")}
            </div>

            <div className="mt-8 space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Access Credentials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2">GitHub Repo</h3>
                            {renderField(<LinkIcon className="w-6 h-6 text-gray-400" />, client.github_repo, "text", client.github_repo, false, "github_repo")}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Web Host</h3>
                            {renderCredentials(
                                <LinkIcon className="w-6 h-6 text-gray-400" />, client.web_host.url,
                                <User className="w-6 h-6 text-gray-400" />, client.web_host.username,
                                <Key className="w-6 h-6 text-gray-400" />, client.web_host.password,
                                "web_host"
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Registrar</h3>
                            {renderCredentials(
                                <LinkIcon className="w-6 h-6 text-gray-400" />, client.registrar.url,
                                <User className="w-6 h-6 text-gray-400" />, client.registrar.username,
                                <Key className="w-6 h-6 text-gray-400" />, client.registrar.password,
                                "registrar"
                            )}
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Additional Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderAdditionalInfo()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientDetailUI;
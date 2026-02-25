import React, { useState, useEffect } from 'react';
import { Input, List, Typography, Space, Checkbox, Spin, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, CodeOutlined } from '@ant-design/icons';
import { searchFiles, type SearchResult } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface GlobalSearchProps {
    onOpenFile: (path: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onOpenFile }) => {
    const { t } = useTranslation();
    const { currentDirectory } = useAppStore();
    const [query, setQuery] = useState('');
    const [contentSearch, setContentSearch] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim() && currentDirectory) {
                handleSearch();
            } else if (!query.trim()) {
                setResults([]);
                setSearched(false);
            }
        }, 500); // Debounce search

        return () => clearTimeout(timer);
    }, [query, contentSearch, currentDirectory]);

    const handleSearch = async () => {
        if (!query.trim() || !currentDirectory) return;

        setLoading(true);
        try {
            const data = await searchFiles(query, currentDirectory, contentSearch);
            setResults(data);
            setSearched(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (filePath: string) => {
        onOpenFile(filePath);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
            <Title level={5} style={{ marginBottom: 12 }}>
                <Space>
                    <SearchOutlined />
                    {t('search.title')}
                </Space>
            </Title>
            
            <Space orientation="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <Input
                    placeholder={t('search.placeholder', 'Search files...')}
                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    allowClear
                />
                <Checkbox 
                    checked={contentSearch} 
                    onChange={(e) => setContentSearch(e.target.checked)}
                >
                    {t('search.content', 'Match Content')}
                </Checkbox>
            </Space>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                        <Spin />
                    </div>
                ) : results.length > 0 ? (
                    <List
                        size="small"
                        dataSource={results}
                        renderItem={(item) => (
                            <List.Item 
                                style={{ 
                                    cursor: 'pointer', 
                                    padding: '8px', 
                                    borderRadius: '4px',
                                    transition: 'background 0.2s'
                                }}
                                className="search-result-item"
                                onClick={() => handleItemClick(item.file)}
                            >
                                <List.Item.Meta
                                    avatar={contentSearch ? <CodeOutlined /> : <FileTextOutlined />}
                                    title={
                                        <Text ellipsis={{ tooltip: item.file }} style={{ maxWidth: '100%' }}>
                                            {item.file.split(/[\\/]/).pop()}
                                        </Text>
                                    }
                                    description={
                                        <Space orientation="vertical" size={0} style={{ width: '100%' }}>
                                            <Text type="secondary" style={{ fontSize: '11px' }} ellipsis>
                                                {item.file.replace(currentDirectory || '', '')}
                                            </Text>
                                            {item.content && (
                                                <Text code type="secondary" style={{ fontSize: '11px' }} ellipsis>
                                                    {item.line ? `L${item.line}: ` : ''}{item.content.trim()}
                                                </Text>
                                            )}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : searched ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('search.noResults', 'No results found')} />
                ) : null}
            </div>
            
             <style>{`
                .search-result-item:hover {
                    background-color: rgba(0, 0, 0, 0.04);
                }
                [data-theme='dark'] .search-result-item:hover {
                    background-color: rgba(255, 255, 255, 0.08);
                }
            `}</style>
        </div>
    );
};

export default GlobalSearch;

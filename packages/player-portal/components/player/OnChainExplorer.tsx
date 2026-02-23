'use client';

import { useState } from 'react';
import { Search, Database, HardDrive, Cpu, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';

const MOCK_DAS_RESPONSE = {
    id: "Hk2...9pQ",
    content: {
        $schema: "https://schema.metaplex.com/nft1.0.json",
        json_uri: "https://arweave.net/...",
        files: [{ uri: "https://arweave.net/...", mime: "image/png" }],
        metadata: {
            name: "Matrix Operator #1337",
            symbol: "OPR",
            description: "Verified agent of the Zion network.",
        }
    },
    authorities: [
        { address: "CQd...dtp", scopes: ["update"] }
    ],
    compression: {
        eligible: false,
        compressed: false,
        data_hash: "",
        creator_hash: "",
        asset_hash: "",
        tree: "",
        seq: 0,
        leaf_id: 0
    },
    grouping: [
        { group_key: "collection", group_value: "Mat...5xR" }
    ],
    royalty: {
        royalty_model: "creators",
        target: null,
        percent: 0.05,
        basis_points: 500,
        primary_sale_happened: false,
        locked: false
    },
    creators: [
        { address: "Matrix...Creator", share: 100, verified: true }
    ],
    ownership: {
        frozen: false,
        delegated: false,
        delegate: null,
        ownership_model: "single",
        owner: "7Tf...You"
    },
    supply: {
        print_max_supply: 0,
        print_current_supply: 0,
        edition_nonce: null
    },
    mutable: true,
    plugins: {
        attributes: [
            { trait_type: "Rank", value: "Specialist" },
            { trait_type: "Faction", value: "Rebel" },
            { trait_type: "Network", value: "Solana" }
        ],
        royalties: {
            basis_points: 500,
            creators: [
                { address: "Sys...Root", percentage: 100 }
            ]
        },
        update_delegate: {
            additional_delegates: ["Quest...Engine"]
        }
    }
};

export default function OnChainExplorer() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [data, setData] = useState<any>(MOCK_DAS_RESPONSE);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setError(null);

        try {
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
            const { DASClient } = await import('@defi-quest/core');
            const dasClient = new DASClient(rpcUrl);

            const asset = await dasClient.getAsset(searchQuery.trim());

            if (asset) {
                setData(asset);
            } else {
                setError('Asset not found');
            }

        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to fetch asset. Check address and try again.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border border-white/10 rounded-2xl overflow-hidden bg-[#0A0F0A]">
            {/* Explorer Header */}
            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-black/40 border-b border-white/5 gap-4">
                <div className="flex items-center gap-2 text-[#4ade80]">
                    <Database className="w-5 h-5" />
                    <span className="font-bold tracking-widest text-sm">METAPLEX_DAS_API</span>
                </div>

                <form onSubmit={handleSearch} className="flex-1 flex flex-col md:max-w-md relative">
                    <div className="flex w-full relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Asset ID or Owner..."
                            className="w-full bg-[#1A221A] border border-white/10 rounded-lg pl-10 pr-24 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#4ade80]"
                        />
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <button
                            type="submit"
                            disabled={isSearching}
                            className={`absolute right-1 top-1 bottom-1 px-3 rounded text-xs font-bold transition-all ${isSearching ? 'bg-gray-600 text-gray-400' : 'bg-[#4ade80]/10 hover:bg-[#4ade80]/20 text-[#4ade80]'}`}
                        >
                            {isSearching ? 'SCANNING...' : 'QUERY'}
                        </button>
                    </div>
                    {error && <span className="absolute -bottom-5 left-1 text-[10px] text-red-500 font-bold">{error}</span>}
                </form>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Visual Data Sidebar */}
                <div className="hidden md:flex flex-col w-64 border-r border-white/5 bg-black/20 p-4 space-y-6 overflow-y-auto no-scrollbar">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Asset Analysis</div>
                        <div className="aspect-square bg-[#1A221A] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-500"></div>
                            <div className="absolute inset-0 bg-[#4ade80]/20 mix-blend-overlay"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <HardDrive className="w-8 h-8 text-white/50 relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-[#4ade80] font-mono truncate">
                                {data?.content?.metadata?.name || 'UNKNOWN ASSET'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Core Plugins Detected</div>

                        {data?.plugins?.attributes && (
                            <div className="p-2 rounded bg-[#4ade80]/5 border border-[#4ade80]/10 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Attributes</span>
                                <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                            </div>
                        )}
                        {data?.plugins?.update_delegate && (
                            <div className="p-2 rounded bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Update Delegate</span>
                                <Cpu className="w-3 h-3 text-blue-500" />
                            </div>
                        )}
                        {data?.plugins?.royalties && (
                            <div className="p-2 rounded bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Royalties</span>
                                <Database className="w-3 h-3 text-purple-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Raw JSON Visualizer */}
                <div className="flex-1 bg-[#050507] p-4 font-mono text-sm overflow-y-auto relative no-scrollbar">
                    {isSearching ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050507]/80 backdrop-blur-sm z-10">
                            <div className="w-12 h-12 border-4 border-[#4ade80]/20 border-t-[#4ade80] rounded-full animate-spin mb-4"></div>
                            <div className="text-[#4ade80] text-xs font-bold tracking-widest animate-pulse">FETCHING RPC DATA...</div>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 sticky top-0 bg-[#050507]/90 py-2 backdrop-blur-md">
                        <Terminal className="w-4 h-4" />
                        <span>~/das/assets/{data?.id || 'pending'}</span>
                    </div>

                    <pre className="text-gray-300 whitespace-pre-wrap word-break">
                        <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(data, null, 2)) }} />
                    </pre>
                </div>
            </div>
        </div>
    );
}

// Simple JSON syntax highlighter
function syntaxHighlight(json: string) {
    let formatted = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return formatted.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'text-green-400'; // number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-blue-400 font-bold'; // key
            } else {
                cls = 'text-orange-300'; // string
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-purple-400'; // boolean
        } else if (/null/.test(match)) {
            cls = 'text-gray-500'; // null
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

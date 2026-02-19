/**
 * DeFi Quest Engine - DAS API Client
 * 
 * Uses Metaplex Digital Asset Standard API for fast asset queries
 * Replaces Supabase with on-chain data reads
 */

export interface DASAsset {
    id: string;
    interface: string;
    content: {
        metadata: {
            name: string;
            symbol: string;
        };
        links?: {
            image?: string;
        };
    };
    authorities?: {
        address: string;
        scopes: string[];
    }[];
    ownership: {
        owner: string;
        delegate?: string;
        frozen: boolean;
    };
    attributes?: {
        attributeList: Array<{ trait_type: string; value: string }>;
    };
}

export interface DASResponse<T> {
    result: T;
    jsonrpc: string;
    id?: string;
}

export class DASClient {
    private rpcUrl: string;
    private apiKey?: string;

    constructor(rpcUrl: string, apiKey?: string) {
        this.rpcUrl = rpcUrl;
        this.apiKey = apiKey;
    }

    private async rpcCall<T>(method: string, params: any): Promise<T> {
        const url = this.rpcUrl.includes('helius') 
            ? this.rpcUrl 
            : 'https://mainnet.helius-rpc.com/?api-key=' + (this.apiKey || 'demo');

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'defi-quest',
                method,
                params,
            }),
        });

        const data: DASResponse<T> = await response.json();
        
        if (!data.result) {
            throw new Error('DAS API error: ' + JSON.stringify(data));
        }
        
        return data.result;
    }

    /**
     * Get all assets by owner wallet
     */
    async getAssetsByOwner(owner: string, limit = 100): Promise<DASAsset[]> {
        const result = await this.rpcCall<{ items: DASAsset[] }>('getAssetsByOwner', {
            ownerAddress: owner,
            page: 1,
            limit,
        });
        
        return result.items;
    }

    /**
     * Get single asset by ID
     */
    async getAsset(assetId: string): Promise<DASAsset> {
        return this.rpcCall<DASAsset>('getAsset', { id: assetId });
    }

    /**
     * Get assets by collection
     */
    async getAssetsByCollection(
        collection: string,
        limit = 100
    ): Promise<DASAsset[]> {
        const result = await this.rpcCall<{ items: DASAsset[] }>('getAssetsByGroup', {
            groupKey: 'collection',
            groupValue: collection,
            page: 1,
            limit,
        });
        
        return result.items;
    }

    /**
     * Search assets by creator
     */
    async getAssetsByCreator(creator: string, limit = 100): Promise<DASAsset[]> {
        const result = await this.rpcCall<{ items: DASAsset[] }>('getAssetsByGroup', {
            groupKey: 'creator',
            groupValue: creator,
            page: 1,
            limit,
        });
        
        return result.items;
    }

    /**
     * Get all items in a collection with pagination
     */
    async getCollectionItems(
        collection: string,
        page = 1,
        limit = 100
    ): Promise<DASAsset[]> {
        const result = await this.rpcCall<{ items: DASAsset[]; total?: number }>(
            'getAssetsByGroup', 
            {
                groupKey: 'collection',
                groupValue: collection,
                page,
                limit,
            }
        );
        
        return result.items;
    }

    /**
     * Get player profile from assets
     */
    async findPlayerProfile(owner: string): Promise<DASAsset | null> {
        const assets = await this.getAssetsByOwner(owner);
        return assets.find(a => 
            a.content?.metadata?.name?.startsWith('Player:')
        ) || null;
    }

    /**
     * Get all badges for a player
     */
    async findPlayerBadges(owner: string): Promise<DASAsset[]> {
        const assets = await this.getAssetsByOwner(owner);
        return assets.filter(a => 
            a.content?.metadata?.name?.includes('Badge')
        );
    }

    /**
     * Get leaderboard data for a collection
     */
    async getLeaderboard(collection: string, limit = 100): Promise<Array<{
        owner: string;
        level: number;
        xp: number;
        name: string;
    }>> {
        const assets = await this.getAssetsByCollection(collection, limit);
        
        return assets
            .filter(a => a.content?.metadata?.name?.startsWith('Player:'))
            .map(a => ({
                owner: a.ownership.owner,
                level: parseInt(a.attributes?.attributeList?.find(t => t.trait_type === 'level')?.value || '1'),
                xp: parseInt(a.attributes?.attributeList?.find(t => t.trait_type === 'total_xp')?.value || '0'),
                name: a.content?.metadata?.name || '',
            }))
            .sort((a, b) => b.xp - a.xp);
    }
}

export function createDASClient(rpcUrl: string, apiKey?: string): DASClient {
    return new DASClient(rpcUrl, apiKey);
}

export default DASClient;

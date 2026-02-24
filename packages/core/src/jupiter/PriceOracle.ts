export class PriceOracle {
    private jupiterApiUrl = 'https://price.jup.ag/v6';

    /**
     * Get current USD price for a token
     */
    async getPrice(tokenSymbol: 'SOL' | 'BTC' | 'ETH' | 'BONK' | 'WIF' | 'JUP'): Promise<number> {
        const tokenIds: Record<string, string> = {
            'SOL': 'So11111111111111111111111111111111111111112',
            'BTC': '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Assuming these are valid WBTC/WETH or similar on Solana
            'ETH': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
            'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
            'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
        };

        try {
            const response = await fetch(
                `${this.jupiterApiUrl}/price?ids=${tokenIds[tokenSymbol]}`
            );

            const data = await response.json();
            const priceData = data.data[tokenIds[tokenSymbol]];

            if (!priceData) {
                throw new Error(`Price not found for ${tokenSymbol}`);
            }

            return priceData.price;

        } catch (error) {
            console.error(`Failed to get price for ${tokenSymbol}:`, error);
            throw error;
        }
    }

    /**
     * Check if prediction was correct
     */
    async checkPrediction(
        asset: string,
        direction: 'above' | 'below',
        targetPrice: number
    ): Promise<{ correct: boolean; actualPrice: number }> {
        const actualPrice = await this.getPrice(asset as any);

        const correct = direction === 'above'
            ? actualPrice > targetPrice
            : actualPrice < targetPrice;

        return { correct, actualPrice };
    }
}

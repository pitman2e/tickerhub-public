using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockHub.Extensions;
using StockHub.Database;
using StockHub.Interfaces;
using StockHub.Models;

namespace StockHub.Repositories;

public class StockRepo(
    IUserClaims userClaims, 
    StockHubContext context)
{
    public async Task<Stock?> GetStockAsync(string stockId)
    {
        return await context.Stocks
            .ByStockId(stockId)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(Stock stock, uint version)
    {
        context.Entry(stock).Property(entity => entity.Version).OriginalValue = version;
        context.Stocks.Update(stock);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Stock stock)
    {
        context.Stocks.Remove(stock);
        await context.SaveChangesAsync();
    }

    public async Task<StockPrice?> GetPriceAsync(string stockId, System.DateOnly marketDate)
    {
        return await context.StockPrices
            .ByStockId(stockId)
            .FirstOrDefaultAsync(price => price.MarketDate == marketDate);
    }

    public async Task InsertPriceAsync(StockPrice price)
    {
        context.StockPrices.Add(price);
        await context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Stock>> GetAsync(
        string portfolioId = "",
        string stockId = "",
        bool isOpenPosOnly = false,
        bool isOrderByPosVal = false,
        string assetClasses = "")
    {
        var assetClassesSplit = string.IsNullOrWhiteSpace(assetClasses) ? null : assetClasses.Split(",");
        
        var rtv = (await context.Stocks
                .Where(s => string.IsNullOrWhiteSpace(stockId) || s.StockId == stockId)
                .Where(p => assetClassesSplit == null || assetClassesSplit.Contains(p.AssetClass))
                .Include(s => 
                    s.FkStockPositions
                        .Where(p => p.Uid == userClaims.GetUid())
                        .Where(p => string.IsNullOrWhiteSpace(portfolioId) || portfolioId == p.PortfolioId)
                        .Where(p => p.IsLatest)
                        )
                .Where(s => !isOpenPosOnly || s.FkStockPositions.Sum(p => p.Quantity) > 0)
                .ToListAsync())
            .OrderByDescending(g =>
                isOrderByPosVal
                    ? g.FkStockPositions.Sum(x =>
                        x.UnrealisedAmount * CurrencyExchangeRate.GetExRateToHKD(x.Currency)) // Cannot conv to Expression?
                    : 0)
            .ThenBy(s => s.StockId)
            .Select(s => s);

        return rtv;
    }
}
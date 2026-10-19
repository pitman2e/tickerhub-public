using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockHub.Database;

namespace StockHub.Repositories;

public class DividendRepo(
    StockHubContext context)
{
    public async Task<List<StockDividend>> GetDividendsAsync(List<string> stockIds2Search)
    {
        return await (
            from d in context.StockDividends
            where stockIds2Search.Contains(d.StockId)
            orderby d.PayableDate descending
            select d
        ).ToListAsync();
    }

    public async Task<StockDividend?> GetByIdAsync(int dividendId)
    {
        return await context.StockDividends.FirstOrDefaultAsync(d => d.DividendId == dividendId);
    }

    public async Task UpdateScripPriceAsync(StockDividend dividend, decimal? scripPrice)
    {
        dividend.ScripPrice = scripPrice;
        context.Update(dividend);
        await context.SaveChangesAsync();
    }
}
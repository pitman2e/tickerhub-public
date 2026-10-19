using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockHub.Database;
using StockHub.Extensions;
using StockHub.Interfaces;

namespace StockHub.Repositories;

public class PortfolioRepo(
    StockHubContext context,
    IUserClaims userClaims
    )
{
    public async Task<IEnumerable<StockPortfolio>> GetAsync(IEnumerable<Expression<Func<StockPortfolio, bool>>>? predicates)
    {
        var query = context.StockPortfolios
            .Include(p => p.FkStockVirtualPortfolios)
            .ByUid(userClaims.GetUid());
        foreach (var predicate in predicates ?? []) query = query.Where(predicate);
        var result = await query
            .OrderBy(p => p.Priority)
            .ToListAsync();

        return result;
    }

    public async Task<StockPortfolio?> FindAsync(string portfolioId)
    {
        return await context.StockPortfolios
            .Include(p => p.FkStockVirtualPortfolios)
            .ByUid(userClaims.GetUid())
            .FirstOrDefaultAsync(p => p.PortfolioId == portfolioId);
    }

    public async Task<List<StockPortfolio>> GetByIdsAsync(IEnumerable<string> portfolioIds)
    {
        var ids = portfolioIds.ToList();
        return await context.StockPortfolios
            .ByUid(userClaims.GetUid())
            .Where(p => ids.Contains(p.PortfolioId))
            .ToListAsync();
    }

    public async Task InsertAsync(StockPortfolio portfolio, IEnumerable<string> childPortfolioIds)
    {
        context.Add(portfolio);
        AddChildPortfolioMappings(portfolio, childPortfolioIds);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(
        StockPortfolio portfolio,
        uint version,
        IEnumerable<string> childPortfolioIds)
    {
        context.Entry(portfolio).Property(entity => entity.Version).OriginalValue = version;
        ReplaceChildPortfolioMappings(portfolio, childPortfolioIds);
        await context.SaveChangesAsync();
    }

    private void AddChildPortfolioMappings(StockPortfolio portfolio, IEnumerable<string> childPortfolioIds)
    {
        foreach (var childPortfolioId in childPortfolioIds)
        {
            portfolio.FkStockVirtualPortfolios.Add(new StockVirtualPortfolio
            {
                Uid = portfolio.Uid,
                PortfolioId = portfolio.PortfolioId,
                ChildPortfolioId = childPortfolioId
            });
        }
    }

    private void ReplaceChildPortfolioMappings(StockPortfolio portfolio, IEnumerable<string> childPortfolioIds)
    {
        var desiredChildPortfolioIds = childPortfolioIds.ToHashSet();
        var obsoleteMappings = portfolio.FkStockVirtualPortfolios
            .Where(mapping => !desiredChildPortfolioIds.Contains(mapping.ChildPortfolioId))
            .ToList();
        context.StockVirtualPortfolios.RemoveRange(obsoleteMappings);
        foreach (var obsoleteMapping in obsoleteMappings)
        {
            portfolio.FkStockVirtualPortfolios.Remove(obsoleteMapping);
        }

        var existingChildPortfolioIds = portfolio.FkStockVirtualPortfolios
            .Select(mapping => mapping.ChildPortfolioId)
            .ToHashSet();
        AddChildPortfolioMappings(
            portfolio,
            desiredChildPortfolioIds.Except(existingChildPortfolioIds));
    }
    
    public async Task DeleteAsync(StockPortfolio portfolio)
    {
        context.Remove(portfolio);
        await context.SaveChangesAsync();
    }
}
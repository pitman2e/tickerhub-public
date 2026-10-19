using System.Linq;
using System.Threading.Tasks;
using StockHub.Controllers.Portfolio;
using StockHub.Database;
using StockHub.Errors;
using StockHub.Repositories;
using StockHub.Services;
using StockHub.Services.Position;
using UnitTests.Mocks;
using Xunit;

namespace UnitTests.Services;

public class PortfolioWriteServiceTest
{
    [Fact]
    public async Task CreatePortfolioAsync_WhenVirtualPortfolioHasRealChildren_SavesMappings()
    {
        using var context = DbContextMock.Get();
        context.StockPortfolios.Add(CreatePortfolio("REAL", isVirtual: false));
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context);

        await service.CreatePortfolioAsync(CreateDto("VIRTUAL", isVirtual: true, "REAL"));

        var mapping = Assert.Single(context.StockVirtualPortfolios);
        Assert.Equal("VIRTUAL", mapping.PortfolioId);
        Assert.Equal("REAL", mapping.ChildPortfolioId);
    }

    [Fact]
    public async Task UpdatePortfolioAsync_ReplacesTheProposedChildMappings()
    {
        using var context = DbContextMock.Get();
        var virtualPortfolio = CreatePortfolio("VIRTUAL", isVirtual: true);
        context.StockPortfolios.AddRange(
            virtualPortfolio,
            CreatePortfolio("REAL1", isVirtual: false),
            CreatePortfolio("REAL2", isVirtual: false));
        context.StockVirtualPortfolios.AddRange(
            CreateMapping("VIRTUAL", "REAL1"),
            CreateMapping("VIRTUAL", "REAL2"));
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context);

        await service.UpdatePortfolioAsync(new PortfolioPutDto
        {
            PortfolioId = "VIRTUAL",
            PortfolioName = "Virtual",
            DefaultCurrency = "HKD",
            IsVirtual = true,
            ChildPortfolioIds = ["REAL2"],
            Version = virtualPortfolio.Version
        });

        var mapping = Assert.Single(context.StockVirtualPortfolios);
        Assert.Equal("REAL2", mapping.ChildPortfolioId);
    }

    [Fact]
    public async Task CreatePortfolioAsync_RejectsChildrenForRealPortfolio()
    {
        using var context = DbContextMock.Get();
        context.StockPortfolios.Add(CreatePortfolio("REAL", isVirtual: false));
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.CreatePortfolioAsync(CreateDto("ANOTHER", isVirtual: false, "REAL")));

        Assert.Equal("A real portfolio cannot have child portfolios", exception.Message);
    }

    [Fact]
    public async Task CreatePortfolioAsync_RejectsDuplicateChildIds()
    {
        using var context = DbContextMock.Get();
        context.StockPortfolios.Add(CreatePortfolio("REAL", isVirtual: false));
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.CreatePortfolioAsync(CreateDto("VIRTUAL", isVirtual: true, "REAL", "REAL")));

        Assert.Equal("Child portfolio IDs must be unique", exception.Message);
    }

    [Fact]
    public async Task CreatePortfolioAsync_RejectsVirtualPortfolioAsChild()
    {
        using var context = DbContextMock.Get();
        context.StockPortfolios.Add(CreatePortfolio("CHILD_VIRTUAL", isVirtual: true));
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.CreatePortfolioAsync(CreateDto("PARENT_VIRTUAL", isVirtual: true, "CHILD_VIRTUAL")));

        Assert.Equal("A virtual portfolio can only contain real portfolios", exception.Message);
    }

    [Fact]
    public async Task CreatePortfolioAsync_RejectsUnknownChildPortfolio()
    {
        using var context = DbContextMock.Get();
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.CreatePortfolioAsync(CreateDto("VIRTUAL", isVirtual: true, "MISSING")));

        Assert.Equal("One or more child portfolios do not exist", exception.Message);
    }

    private static PortfolioService CreateService(StockHubContext context)
    {
        var userClaims = UserClaimMock.Get();
        return new PortfolioService(
            context,
            new PositionValueService(context),
            new TickerIdParser(TestExchanges.Get()),
            userClaims,
            new PortfolioRepo(context, userClaims));
    }

    private static StockPortfolio CreatePortfolio(string portfolioId, bool isVirtual) => new()
    {
        Uid = "TEST_UID",
        PortfolioId = portfolioId,
        Name = portfolioId,
        DefaultCurrency = "HKD",
        Priority = 0,
        IsVirtual = isVirtual
    };

    private static StockVirtualPortfolio CreateMapping(string portfolioId, string childPortfolioId) => new()
    {
        Uid = "TEST_UID",
        PortfolioId = portfolioId,
        ChildPortfolioId = childPortfolioId
    };

    private static PortfolioPostDto CreateDto(
        string portfolioId,
        bool isVirtual,
        params string[] childPortfolioIds) => new()
    {
        PortfolioId = portfolioId,
        PortfolioName = portfolioId,
        DefaultCurrency = "HKD",
        IsVirtual = isVirtual,
        ChildPortfolioIds = childPortfolioIds.ToList()
    };
}
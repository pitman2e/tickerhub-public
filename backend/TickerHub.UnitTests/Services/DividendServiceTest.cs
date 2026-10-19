using System.Threading.Tasks;
using StockHub.Controllers.Dividend;
using StockHub.Database;
using StockHub.Errors;
using StockHub.Repositories;
using StockHub.Services;
using UnitTests.Mocks;
using Xunit;

namespace UnitTests.Services;

public class DividendServiceTest
{
    [Fact]
    public async Task UpdateScripPriceAsync_WhenPriceIsNegative_ThrowsArgumentException()
    {
        var service = CreateService(DbContextMock.Get());

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.UpdateScripPriceAsync(new DividendPutDto { DividendId = 1, ScripPrice = -1 }));

        Assert.Equal("Scrip price must not be a negative number", exception.Message);
        Assert.Equal(nameof(DividendPutDto.ScripPrice), exception.FieldName);
    }

    [Fact]
    public async Task UpdateScripPriceAsync_WhenDividendDoesNotExist_ThrowsArgumentException()
    {
        var service = CreateService(DbContextMock.Get());

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.UpdateScripPriceAsync(new DividendPutDto { DividendId = 1, ScripPrice = 1 }));

        Assert.Equal("Corresponding stock dividend entry not found", exception.Message);
    }

    [Fact]
    public async Task UpdateScripPriceAsync_WhenDividendDoesNotSupportScrip_ThrowsArgumentException()
    {
        var context = DbContextMock.Get();
        context.StockDividends.Add(new StockDividend
        {
            DividendId = 1,
            StockId = "TEST.US",
            AnnounceDate = new System.DateOnly(2023, 12, 1),
            DividendEvent = "TEST",
            DividendType = StockDividend.DIV_TYPE_DIVIDEND,
            DistributionType = StockDividend.DIST_TYPE_CASH,
            Amount = 1,
            ExDate = new System.DateOnly(2023, 12, 15),
            PayableDate = new System.DateOnly(2024, 1, 1),
            Currency = "USD"
        });
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.UpdateScripPriceAsync(new DividendPutDto { DividendId = 1, ScripPrice = 1 }));

        Assert.Equal("Corresponding stock dividend distribution type is not 'Scrip'", exception.Message);
    }

    private static DividendService CreateService(StockHubContext context) =>
        new(
            null!,
            context,
            null!,
            null!,
            null!,
            new DividendRepo(context),
            null!,
            null!,
            null!);
}
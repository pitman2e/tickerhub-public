using System;
using System.Linq;
using System.Threading.Tasks;
using JetBrains.Annotations;
using StockHub.Controllers.Price;
using StockHub.Controllers.Stocks;
using StockHub.Database;
using StockHub.Errors;
using StockHub.Repositories;
using StockHub.Services;
using UnitTests.Mocks;
using Xunit;

namespace UnitTests.Services;

[TestSubject(typeof(StocksService))]
public class StocksServiceTest(
    //ITestOutputHelper testOutputHelper
    )
{
    [Fact]
    public async Task CanRun()
    {
        var userClaim = UserClaimMock.Get();
        var context = DbContextMock.Get();
        
        DatabaseSetup.AddStock(context);

        Assert.NotEmpty(context.Stocks);

        var nowDate = new DateOnly(2022, 1, 17);

        {
            StockPrice price = new StockPrice
            {
                StockId = "99999.HK",
                MarketDate = new DateOnly(2021, 12, 31),
                OpenPrice = 100,
                ClosePrice = 100
            };
            context.StockPrices.Add(price);
        }

        {
            StockPrice price = new StockPrice
            {
                StockId = "99999.HK",
                MarketDate = new DateOnly(2022, 1, 3),
                OpenPrice = 90,
                ClosePrice = 90
            };
            context.StockPrices.Add(price);
        }

        {
            StockPrice price = new StockPrice
            {
                StockId = "99999.HK",
                MarketDate = new DateOnly(2022, 1, 4),
                OpenPrice = 10,
                ClosePrice = 10
            };
            context.StockPrices.Add(price);
        }

        {
            StockPrice price = new StockPrice
            {
                StockId = "99999.HK",
                MarketDate = nowDate,
                OpenPrice = 80,
                ClosePrice = 80
            };
            context.StockPrices.Add(price);
        }

        await context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var stockServ = CreateService(context, userClaim);
        var perf = await stockServ.GetPerformanceAsync(nowDate, "99999.HK");

        Assert.Equal(-20, perf.YTD);
        Assert.Equal(-20, perf.DropFromTop);
    }

    [Fact]
    public async Task StalePrice_ReturnsNullPerformance()
    {
        var userClaim = UserClaimMock.Get();
        var context = DbContextMock.Get();

        DatabaseSetup.AddStock(context);

        // Latest price is ~1 month before benchmark, outside the 10-day lookback.
        var benchmarkDate = new DateOnly(2026, 10, 9);
        var staleDate = new DateOnly(2026, 9, 8);

        context.StockPrices.Add(new StockPrice
        {
            StockId = "99999.HK",
            MarketDate = staleDate,
            OpenPrice = 100,
            ClosePrice = 100
        });

        await context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var stockServ = CreateService(context, userClaim);
        var perf = await stockServ.GetPerformanceAsync(benchmarkDate, "99999.HK");

        Assert.Null(perf.YTD);
        Assert.Null(perf.OneYear);
        Assert.Null(perf.ThreeYear);
        Assert.Null(perf.FiveYear);
        Assert.Null(perf.OneMonth);
        Assert.Null(perf.ThreeMonth);
        Assert.Null(perf.DropFromTop);
    }

    [Fact]
    public async Task CreateAsync_WhenStockIdAlreadyExists_ShouldThrowArgumentException()
    {
        var context = DbContextMock.Get();
        DatabaseSetup.AddStock(context);
        var stockServ = CreateService(context, UserClaimMock.Get());

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            stockServ.CreateAsync(new StockPostDto { stockId = "99999.HK" }));

        Assert.Equal("Stock Id already exist", exception.Message);
        Assert.Equal(nameof(StockPostDto.stockId), exception.FieldName);
    }

    [Fact]
    public async Task UpdateAsync_WhenStockDoesNotExist_ShouldThrowArgumentException()
    {
        var service = CreateService(DbContextMock.Get(), UserClaimMock.Get());

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() =>
            service.UpdateAsync(new StockPutDto { KeyStockId = "UNKNOWN.US", Version = 1 }));

        Assert.Equal("Stock Id does not exist", exception.Message);
        Assert.Equal(nameof(StockPutDto.StockId), exception.FieldName);
    }

    [Fact]
    public async Task CreatePriceAsync_WhenPriceAlreadyExists_ReturnsFalse()
    {
        var context = DbContextMock.Get();
        var marketDate = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(1704153600).UtcDateTime);
        context.StockPrices.Add(new StockPrice
        {
            StockId = "99999.HK",
            MarketDate = marketDate,
            ClosePrice = 10
        });
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var service = CreateService(context, UserClaimMock.Get());

        var created = await service.CreatePriceAsync(new PricePostDto
        {
            StockId = "99999.HK",
            MarketDate = 1704153600,
            Price = 11
        });

        Assert.False(created);
        Assert.Single(context.StockPrices);
    }

    [Fact]
    public async Task CreatePriceAsync_WhenPriceDoesNotExist_PersistsPrice()
    {
        var context = DbContextMock.Get();
        var service = CreateService(context, UserClaimMock.Get());

        var created = await service.CreatePriceAsync(new PricePostDto
        {
            StockId = "99999.HK",
            MarketDate = 1704153600,
            Price = 11
        });

        Assert.True(created);
        var price = Assert.Single(context.StockPrices);
        Assert.Equal(11, price.ClosePrice);
        Assert.Equal(DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(1704153600).UtcDateTime), price.MarketDate);
    }

    [Fact]
    public async Task DeleteAsync_WhenStockDoesNotExist_ReturnsNull()
    {
        var service = CreateService(DbContextMock.Get(), UserClaimMock.Get());

        var stock = await service.DeleteAsync("MISSING.US");

        Assert.Null(stock);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesStockThroughRepository()
    {
        var context = DbContextMock.Get();
        DatabaseSetup.AddStock(context);
        var stock = context.Stocks.Single();
        var service = CreateService(context, UserClaimMock.Get());

        var updatedStock = await service.UpdateAsync(new StockPutDto
        {
            KeyStockId = stock.StockId,
            Version = stock.Version,
            StockName = "Updated name",
            Currency = "USD",
            AssetClass = "STOCK"
        });

        Assert.Equal("Updated name", updatedStock.StockName);
        Assert.Equal("USD", updatedStock.Currency);
        Assert.Equal("Updated name", context.Stocks.Single().StockName);
    }

    [Fact]
    public async Task DeleteAsync_WhenStockExists_RemovesStockThroughRepository()
    {
        var context = DbContextMock.Get();
        DatabaseSetup.AddStock(context);
        var service = CreateService(context, UserClaimMock.Get());

        var deletedStock = await service.DeleteAsync("99999.HK");

        Assert.NotNull(deletedStock);
        Assert.Empty(context.Stocks);
    }

    private static StocksService CreateService(StockHubContext context, UserClaimMock userClaims) =>
        new(context, userClaims, new StockRepo(userClaims, context));
}

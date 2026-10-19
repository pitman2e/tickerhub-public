using JetBrains.Annotations;
using StockHub.Crawlers;
using StockHub.Models;
using Xunit;

namespace UnitTests.Crawlers;

[TestSubject(typeof(AastocksStockIdMapper))]
public class AastocksStockIdMapperTest
{
    [Theory]
    [InlineData("00001.HK", "00001")]
    [InlineData("ABC.US", "ABC")]
    public void Map(string stockId,
        string? expectedStockId)
    {
        Assert.Equal(expectedStockId, AastocksStockIdMapper.Map(new TickerParams(stockId)));
    }
}
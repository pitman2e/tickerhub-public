using JetBrains.Annotations;
using StockHub.Crawlers;
using StockHub.Models;
using Xunit;

namespace UnitTests.Crawlers;

[TestSubject(typeof(NasdaqStockIdMapper))]
public class NasdaqStockIdMapperTest
{
    [Theory]
    [InlineData("00001.HK", null)]
    [InlineData("ABC.US", "ABC")]
    public void Map(string stockId,
        string? expectedStockId)
    {
        Assert.Equal(expectedStockId, NasdaqStockIdMapper.Map(new TickerParams(stockId)));
    }
}
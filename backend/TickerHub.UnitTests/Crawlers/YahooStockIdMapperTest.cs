using JetBrains.Annotations;
using StockHub.Crawlers;
using StockHub.Models;
using Xunit;

namespace UnitTests.Crawlers;

[TestSubject(typeof(YahooStockIdMapper))]
public class YahooStockIdMapperTest
{
    [Theory]
    [InlineData("00001.HK", "0001.HK")]
    [InlineData("ABC.US", "ABC")]
    [InlineData("CORE.PCP", null)]
    [InlineData("LSLE.LSE", "LSLE.L")]
    public void Map(string stockId,
        string? expectYahooStockId)
    {
        Assert.Equal(expectYahooStockId, YahooStockIdMapper.Map(new TickerParams(stockId)));
    }
}
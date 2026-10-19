using System.Threading.Tasks;
using FluentValidation.TestHelper;
using JetBrains.Annotations;
using StockHub.Controllers.Stocks;
using StockHub.Services;
using UnitTests.Mocks;
using Xunit;

namespace UnitTests.Controllers.Stocks;

// [AI-Generated]
[TestSubject(typeof(StockPostDtoValidator))]
public class StockPostDtoValidatorTest
{
    private readonly TickerIdParser _tickerIdParser;
    private readonly StockPostDtoValidator _validator;

    public StockPostDtoValidatorTest()
    {
        _tickerIdParser = new TickerIdParser(TestExchanges.Get());

        _validator = new StockPostDtoValidator(_tickerIdParser);
    }

    [Fact]
    public async Task Validate_WhenStockIdFormatIsInvalid_ShouldHaveValidationError()
    {
        var dto = new StockPostDto { stockId = "INVALID_ID" };

        var result = await _validator.TestValidateAsync(dto, cancellationToken: TestContext.Current.CancellationToken);

        result.ShouldHaveValidationErrorFor(x => x.stockId)
              .WithErrorMessage("Invalid Stock Id format");
    }

    [Fact]
    public async Task Validate_WhenStockPostDtoIsValid_ShouldNotHaveValidationError()
    {
        var dto = new StockPostDto { stockId = "MSFT.US" };

        var result = await _validator.TestValidateAsync(dto, cancellationToken: TestContext.Current.CancellationToken);

        result.ShouldNotHaveValidationErrorFor(x => x.stockId);
    }
}
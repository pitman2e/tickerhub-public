using FluentValidation.TestHelper;
using JetBrains.Annotations;
using StockHub.Controllers.Stocks;
using StockHub.Services;
using UnitTests.Mocks;
using Xunit;

namespace UnitTests.Controllers.Stocks;

// [AI-Generated]
[TestSubject(typeof(StockPutDtoValidator))]
public class StockPutDtoValidatorTest
{
    private readonly TickerIdParser _tickerIdParser;
    private readonly StockPutDtoValidator _validator;

    public StockPutDtoValidatorTest()
    {
        _tickerIdParser = new TickerIdParser(TestExchanges.Get());
        _validator = new StockPutDtoValidator(_tickerIdParser);
    }

    [Fact]
    public void Validate_WhenTickerFormatIsValid_DoesNotRequireStockExistence()
    {
        var dto = new StockPutDto { KeyStockId = "UNKNOWN.US", Version = 1 };

        var result = _validator.TestValidate(dto);

        result.ShouldNotHaveValidationErrorFor(x => x.StockId);
    }

    [Fact]
    public void Validate_WhenStockIdFormatIsInvalid_ShouldHaveValidationError()
    {
        var dto = new StockPutDto { KeyStockId = "BAD.FORMAT", Version = 1 };

        var result = _validator.TestValidate(dto);

        result.ShouldHaveValidationErrorFor(x => x.StockId)
              .WithErrorMessage("Invalid Stock Id format");
    }

    [Fact]
    public void Validate_WhenVersionIsZero_ShouldHaveValidationError()
    {
        var dto = new StockPutDto { KeyStockId = "AAPL.US", Version = 0 };

        var result = _validator.TestValidate(dto);

        result.ShouldHaveValidationErrorFor(x => x.Version)
              .WithErrorMessage("Row version is required");
    }

    [Fact]
    public void Validate_WhenStockPutDtoIsValid_ShouldNotHaveValidationError()
    {
        var dto = new StockPutDto { KeyStockId = "AAPL.US", Version = 1 };

        var result = _validator.TestValidate(dto);

        result.ShouldNotHaveValidationErrorFor(x => x.StockId);
        result.ShouldNotHaveValidationErrorFor(x => x.Version);
    }
}
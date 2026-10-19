using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockHub.Database;
using StockHub.Errors;
using StockHub.Services.Transaction;
using UnitTests.Mocks;
using Xunit;

namespace UnitTests.Services;

public class TransactionWriteWorkflowTest
{
    [Fact]
    public void StockTransactionDecimalProperties_UsePrecision13Scale6()
    {
        using var context = DbContextMock.Get();
        var entityType = context.Model.FindEntityType(typeof(StockTransaction))!;

        foreach (var propertyName in new[]
                 {
                     nameof(StockTransaction.UnitAmt),
                     nameof(StockTransaction.TxCount),
                     nameof(StockTransaction.HandlingFee),
                     nameof(StockTransaction.AccruedInterest),
                     nameof(StockTransaction.YTM),
                     nameof(StockTransaction.Tax)
                 })
        {
            var property = entityType.FindProperty(propertyName)!;
            Assert.Equal(13, property.GetPrecision());
            Assert.Equal(6, property.GetScale());
        }
    }

    [Fact]
    public async Task UpdateAsync_WhenTransactionDoesNotExist_ThrowsArgumentException()
    {
        var workflow = CreateWorkflow(DbContextMock.Get());

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() => workflow.UpdateAsync(
            "TEST_UID",
            1,
            1,
            CreateSellData()));

        Assert.Equal("Transaction to update not found", exception.Message);
        Assert.Equal("iden", exception.FieldName);
    }

    [Fact]
    public async Task UpdateAsync_WhenSellExceedsOpenPosition_ThrowsArgumentException()
    {
        var context = DbContextMock.Get();
        var transaction = DatabaseSetup.AddStockTran(
            context,
            10,
            StockTransaction.TRANTYPE_BUY,
            new DateOnly(2024, 1, 2));
        var workflow = CreateWorkflow(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() => workflow.UpdateAsync(
            "TEST_UID",
            transaction.iden,
            transaction.Version,
            CreateSellData()));

        Assert.Equal("TxCount", exception.FieldName);
        Assert.Equal(StockTransaction.TRANTYPE_BUY, transaction.TranType);
        Assert.Equal(1, transaction.TxCount);
    }

    [Theory]
    [InlineData(-1, StockTransaction.TRANTYPE_BUY)]
    [InlineData(1, StockTransaction.TRANTYPE_SELL)]
    [InlineData(0, StockTransaction.TRANTYPE_BUY)]
    public async Task CreateAsync_WhenCountSignDoesNotMatchTransactionType_ThrowsArgumentException(
        decimal txCount,
        string tranType)
    {
        var workflow = CreateWorkflow(DbContextMock.Get());

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() => workflow.CreateAsync(
            "TEST_UID",
            "TEST_PORTFOLIO",
            "TEST_STOCK",
            CreateSellData() with { TxCount = txCount, TranType = tranType }));

        Assert.Equal("TxCount", exception.FieldName);
    }

    [Fact]
    public async Task UpdateAsync_WhenCountSignDoesNotMatchTransactionType_ThrowsArgumentException()
    {
        var context = DbContextMock.Get();
        var transaction = DatabaseSetup.AddStockTran(
            context,
            10,
            StockTransaction.TRANTYPE_BUY,
            new DateOnly(2024, 1, 2));
        var workflow = CreateWorkflow(context);

        var exception = await Assert.ThrowsAsync<SHArgumentException>(() => workflow.UpdateAsync(
            "TEST_UID",
            transaction.iden,
            transaction.Version,
            CreateSellData() with { TxCount = -1, TranType = StockTransaction.TRANTYPE_BUY }));

        Assert.Equal("TxCount", exception.FieldName);
    }

    private static TransactionWriteWorkflow CreateWorkflow(StockHubContext context) =>
        new(context, null!, null!, null!, null!);

    private static TransactionWriteData CreateSellData() => new(
        -1,
        StockTransaction.TRANTYPE_SELL,
        null,
        null,
        null,
        null,
        null,
        new DateOnly(2024, 1, 3),
        1,
        false);
}